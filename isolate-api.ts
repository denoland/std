import { deserializeError } from 'serialize-error'
import Accumulator from './exe/accumulator.ts'
import Compartment from './io/compartment.ts'
import { assert, Debug } from '@utils'
import {
  DispatchFunctions,
  IsolatePromise,
  isSettledIsolatePromise,
  PID,
  toActions,
  UnsequencedRequest,
} from '@/constants.ts'
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
type Options = {
  isEffect: boolean
  isEffectRecovered: boolean
}
export default class IsolateApi<T extends object = Default> {
  #accumulator: Accumulator
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  #isEffect = false
  #isEffectRecovered = false
  #abort = new AbortController()
  private constructor(accumulator: Accumulator) {
    this.#accumulator = accumulator
  }
  static create(accumulator: Accumulator, opts?: Options) {
    const api = new IsolateApi(accumulator)
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

  async actions<T = DispatchFunctions>(isolate: string, targetPID?: PID) {
    const target = targetPID ? targetPID : this.pid
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.action(request)
    return toActions<T>(target, isolate, schema, execute)
  }
  action(request: UnsequencedRequest) {
    const recovered = this.#accumulator.recover(request)
    if (recovered) {
      assert(isSettledIsolatePromise(recovered), 'recovered is not settled')
      const { outcome } = recovered
      if (outcome.error) {
        throw deserializeError(outcome.error)
      }
      return Promise.resolve(outcome.result)
    }
    const promise = new Promise((resolve, reject) => {
      const store: IsolatePromise = { request, resolve, reject }
      this.#accumulator.push(store)
    })
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
  readJSON<T>(path: string): Promise<T> {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('readJSON', path)
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
  ls(path: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('ls', path)
    return this.#fs.ls(path)
  }
  delete(filepath: string) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('delete', filepath)
    return this.#fs.delete(filepath)
  }
  readTip(pid: PID) {
    // try read the pid head ?
    // is this relative only to what the current commit is ?
    // ie: should this be fresh, or repeatable ?
    // IF the io json file i
    // read the io json file and look for branches that are open
    // daemon stays open long time ?
    // should daemon be tracked in iojson ?
    // in this way, we can walk the whole tree

    // if the daemon moves, it must always update its parent

    // so at this commit, check if the io channel spawned the child in question

    // assert this is a child pid

    // walk arbitrarily deep to verify if it is a child

    // be sure to include branch operations that are transient as well as
    // daemons

    // for now, throw if tries to go deeper than immediate children
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
}
