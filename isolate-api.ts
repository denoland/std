import { deserializeError } from 'serialize-error'
import Accumulator from './exe/accumulator.ts'
import Compartment from './io/compartment.ts'
import { assert, Debug } from '@utils'
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
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
type EffectOptions = {
  isEffect: boolean
  isEffectRecovered: boolean
}
export default class IsolateApi<T extends object = Default> {
  #accumulator: Accumulator
  #origin: SolidRequest | undefined
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  #isEffect = false
  #isEffectRecovered = false
  #abort = new AbortController()
  private constructor(accumulator: Accumulator, origin?: SolidRequest) {
    this.#accumulator = accumulator
    this.#origin = origin
  }
  static create(
    accumulator: Accumulator,
    origin?: SolidRequest,
    opts?: EffectOptions,
  ) {
    const api = new IsolateApi(accumulator, origin)
    if (opts) {
      api.#isEffect = opts.isEffect || false
      api.#isEffectRecovered = opts.isEffectRecovered || false
    }
    return api
  }
  static createContext<T extends object = Default>() {
    // TODO find a more graceful way to do this for cradle setup
    return new IsolateApi<T>(
      null as unknown as Accumulator,
    )
  }
  get #fs() {
    return this.#accumulator.fs
  }
  get pid() {
    return this.#fs.pid
  }
  get origin() {
    if (!this.#origin) {
      throw new Error('origin not set')
    }
    return this.#origin
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

  async actions<T = DispatchFunctions>(isolate: string, opts: RpcOpts = {}) {
    const { target = this.pid, ...procOpts } = opts
    freezePid(target)
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.action(request)
    return toActions<T>(target, isolate, schema, procOpts, execute)
  }
  async requests<T extends ApiFunctions>(isolate: string, opts: RpcOpts = {}) {
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
      let promise: MetaPromise
      if (outcome.error) {
        promise = Promise.reject(deserializeError(outcome.error))
      } else {
        promise = Promise.resolve(outcome.result)
      }
      promise[META_SYMBOL] = { parent: recovered.parent }
      return promise
    }
    let resolve, reject
    const promise = new Promise((_resolve, _reject) => {
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
  async functions<T = DispatchFunctions>(isolate: string): Promise<T> {
    // TODO these need some kind of PID attached ?
    const compartment = await Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions<T>(this)
  }
  async apiSchema(isolate: string) {
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
  async isChild(pid: PID) {
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
  async lsChildren() {
    const obj = await this.readJSON<IoStruct>('.io.json')
    return Object.values(obj.branches)
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
    assert(this.#accumulator.isParent(commit), 'Parent is not in scope')
    log('overwrite', commit, excludes)
    return this.#fs.overwrite(commit, ...excludes)
  }
}
