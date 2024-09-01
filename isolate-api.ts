import { deserializeError } from 'serialize-error'
import Accumulator from './exe/accumulator.ts'
import Compartment from './io/compartment.ts'
import { assert, Debug } from '@utils'
import micromatch from 'micromatch'
import {
  ApiFunctions,
  DispatchFunctions,
  freezePid,
  IoStruct,
  isChildOf,
  isSettledIsolatePromise,
  META_SYMBOL,
  MetaPromise,
  PID,
  print,
  PromisedIsolatePromise,
  RpcOpts,
  SolidRequest,
  toActions,
  UnsequencedRequest,
} from '@/constants.ts'
import { type Isolate } from '@/isolates/index.ts'
import IOChannel from '@io/io-channel.ts'
import { z, ZodTypeAny } from 'zod'
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
type EffectOptions = {
  isEffect: boolean
  isEffectRecovered: boolean
}

export default class IA<T extends object = Default> {
  #accumulator: Accumulator
  #origin: SolidRequest
  #originCommit: string | undefined
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  #isEffect = false
  #isEffectRecovered = false
  #abort = new AbortController()
  private constructor(
    accumulator: Accumulator,
    origin: SolidRequest,
    originCommit?: string,
  ) {
    this.#accumulator = accumulator
    this.#origin = origin
    this.#originCommit = originCommit
  }
  static create(
    accumulator: Accumulator,
    origin: SolidRequest,
    originCommit?: string,
    opts?: EffectOptions,
  ) {
    const api = new IA(accumulator, origin, originCommit)
    if (opts) {
      api.#isEffect = opts.isEffect || false
      api.#isEffectRecovered = opts.isEffectRecovered || false
    }
    return api
  }
  static createContext<T extends object = Default>() {
    // TODO find a more graceful way to do this for cradle setup
    return new IA<T>(
      null as unknown as Accumulator,
      null as unknown as SolidRequest,
    )
  }
  get #fs() {
    return this.#accumulator.fs
  }
  get pid() {
    return this.#fs.pid
  }
  get origin() {
    return this.#origin
  }
  /** The commit from the origin action */
  get originCommit() {
    return this.#originCommit
  }
  get commit() {
    return this.#fs.oid
  }
  /** If this execution is side effect capable.  May extend to get permissions
   * information  */
  get isEffect() {
    return this.#isEffect
  }
  /** If the side effect lock was broken in order to start this instance.
   * Implies the previous executing instance was aborted */
  get isEffectRecovered() {
    return this.#isEffectRecovered
  }
  /** Side effects can listen to this signal to abort their activities */
  get signal() {
    assert(this.#accumulator.isActive, 'Activity is denied')
    // return an abort signal
    assert(this.isEffect, 'signal only available for side effects')
    return this.#abort.signal
  }
  // TODO make get and set config be synchronous
  async config<T>(schema: z.ZodObject<Record<string, ZodTypeAny>>) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    const io = await IOChannel.read(this.#fs)
    assert(io, 'config not found')
    return schema.parse(io.config) as T
  }
  async updateConfig(
    updater: (config: IoStruct['config']) => IoStruct['config'],
    schema: z.ZodObject<Record<string, ZodTypeAny>>,
  ) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    const io = await IOChannel.read(this.#fs)
    assert(io, 'config not found')
    const config = schema.parse(io.config)
    const next = schema.parse(updater(config))
    assert(io, 'config not found')
    io.config = next
  }

  async actions<T = DispatchFunctions>(isolate: Isolate, opts: RpcOpts = {}) {
    const { target = this.pid, ...procOpts } = opts
    freezePid(target)
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.action(request)
    return toActions<T>(target, isolate, schema, procOpts, execute)
  }
  async requests<T extends ApiFunctions>(isolate: Isolate, opts: RpcOpts = {}) {
    const { target = this.pid, ...procOpts } = opts
    freezePid(target)

    type Unseq = {
      [K in keyof T]: (...args: Parameters<T[K]>) => UnsequencedRequest
    }

    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => request
    return toActions<Unseq>(target, isolate, schema, procOpts, execute)
  }
  action(request: UnsequencedRequest) {
    const recovered = this.#accumulator.recover(request)
    if (recovered) {
      assert(isSettledIsolatePromise(recovered), 'recovered is not settled')
      const { outcome } = recovered
      let promise: MetaPromise<typeof outcome.result>
      if (outcome.error) {
        promise = Promise.reject(deserializeError(outcome.error))
      } else {
        promise = Promise.resolve(outcome.result)
      }
      promise[META_SYMBOL] = { parent: recovered.parent }
      return promise
    }
    let resolve, reject
    const promise: MetaPromise<unknown> = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })
    assert(resolve)
    assert(reject)
    const promised: PromisedIsolatePromise = {
      promise,
      request,
      resolve,
      reject,
    }
    this.#accumulator.push(promised)
    return promise
  }
  /**
   * Used to call the functions of an isolate purely, without going thru the IO
   * subsystem which would otherwise cost a commit to the chain.
   * @param isolate The name of the isolate to load the functions for
   * @returns An object keyed by API function name, with values being the
   * function itself.
   */
  async functions<T = DispatchFunctions>(isolate: Isolate): Promise<T> {
    // TODO these need some kind of PID attached ?
    const compartment = await Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions<T>(this)
  }
  async apiSchema(isolate: Isolate) {
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  writeJSON(path: string, json: unknown) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('writeJSON', path)
    this.#fs.writeJSON(path, json)
  }
  write(path: string, content: string | Uint8Array = '') {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('write', path)
    this.#fs.write(path, content)
  }
  async readJSON<T>(path: string, fallback?: T): Promise<T> {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('readJSON', path, fallback)
    if (fallback !== undefined) {
      if (!await this.#fs.exists(path)) {
        return fallback
      }
    }
    return this.#fs.readJSON<T>(path)
  }
  read(path: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    return this.#fs.read(path)
  }
  readOid(path: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    return this.#fs.readOid(path)
  }
  readBinary(path: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('readBinary', path)
    return this.#fs.readBinary(path)
  }
  exists(path: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('exists', path)
    return this.#fs.exists(path)
  }
  ls(path: string = '.') {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('ls', path)
    return this.#fs.ls(path)
  }
  delete(filepath: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('delete', filepath)
    return this.#fs.delete(filepath)
  }

  async isActiveChild(pid: PID) {
    if (!isChildOf(pid, this.pid)) {
      throw new Error('not child: ' + print(pid) + ' of ' + print(this.pid))
      // TODO allow recursive PID walking
      // TODO allow walking parents and remote repos
    }
    // TODO use a direct db lookup, relying on the atomic guarantees

    const obj = await this.readJSON<IoStruct>('.io.json')
    const child = pid.branches[pid.branches.length - 1]
    log('readTip', child)
    for (const branchName of Object.values(obj.branches)) {
      if (branchName === child) {
        return true
      }
    }
    return false
  }
  async lsChildren(patterns: string[] = []) {
    const obj = await this.readJSON<IoStruct>('.io.json')
    const branches = Object.values(obj.branches)
    return micromatch(branches, patterns)
  }
  get context() {
    // TODO at creation, this should flag context capable and reject if not
    return this.#context as T
  }
  set context(context: Partial<T>) {
    // TODO reject if any fs operations or actions are attempted
    assert(typeof context === 'object', 'context must be an object')
    assert(context !== null, 'context must not be null')
    this.#context = context
  }
  isPidExists(pid: PID) {
    // TODO push a self responding action to the accumulator for repeatability
    return this.#fs.isPidExists(pid)
  }
  merge(commit: string, ...excludes: string[]) {
    if (commit !== this.originCommit) {
      assert(this.#accumulator.isParent(commit), 'Parent is not in scope')
    }
    log('overwrite', commit, excludes)
    return this.#fs.overwrite(commit, ...excludes)
  }
  mv(from: string, to: string) {
    return this.#fs.mv(from, to)
  }
}
