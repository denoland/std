import Accumulator from './exe/accumulator.ts'
import Compartment from './io/compartment.ts'
import { assert, Debug, equal, fromOutcome, print } from '@utils'
import {
  DispatchFunctions,
  getProcType,
  JsonValue,
  Params,
  PID,
  ProcessOptions,
  UnsequencedRequest,
} from '@/constants.ts'
import FS from '@/git/fs.ts'
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
type Options = {
  isEffect: boolean
  isEffectRecovered: boolean
}
export default class IsolateApi<T extends object = Default> {
  #fs: FS
  #accumulator: Accumulator
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  #isEffect = false
  #isEffectRecovered = false
  #abort = new AbortController()
  private constructor(fs: FS, accumulator: Accumulator) {
    this.#fs = fs
    this.#accumulator = accumulator
  }
  static create(fs: FS, accumulator: Accumulator, opts: Options) {
    const api = new IsolateApi(fs, accumulator)
    if (opts) {
      api.#isEffect = opts.isEffect || false
      api.#isEffectRecovered = opts.isEffectRecovered || false
    }
    return api
  }
  static createContext<T extends object = Default>() {
    // TODO find a more graceful way to do this for cradle setup
    return new IsolateApi<T>(
      null as unknown as FS,
      null as unknown as Accumulator,
    )
  }
  get pid() {
    return this.#fs.pid
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
  async actions(isolate: string, targetPID?: PID) {
    const target = targetPID ? targetPID : this.pid
    log('actions', isolate, print(target))
    const schema = await this.isolateApiSchema(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(schema)) {
      actions[functionName] = (params?: Params, options?: ProcessOptions) => {
        assert(this.#accumulator.isActive, 'Activity is denied')
        log('actions %o', functionName)
        // TODO unify how proctype is derived across all cradles
        if (equal(targetPID, this.pid)) {
          if (!options) {
            options = { branch: true }
          }
          assert(options.branch || options.noClose, 'no loopback serial')
        }
        const proctype = getProcType(options)
        assert(this.#accumulator, 'accumulator must be set')
        const unsequencedRequest: UnsequencedRequest = {
          target,
          isolate,
          functionName,
          params: params || {},
          proctype,
        }
        return this.action(unsequencedRequest)
      }
    }

    return actions
  }
  async action(request: UnsequencedRequest) {
    const recovered = this.#accumulator.recover(request)
    // at this point, we might need to tick the fs commit forwards
    if (recovered) {
      const { outcome } = recovered
      assert(outcome, 'outcome must be set')
      await Promise.resolve()
      return fromOutcome(outcome)
    }

    const promise = new Promise((resolve, reject) => {
      this.#accumulator.push({ request, resolve, reject })
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
  async isolateApiSchema(isolate: string) {
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  writeJSON(path: string, json: JsonValue) {
    assert(this.#accumulator.isActive, 'Activity is denied')
    log('writeJSON', path)
    this.#fs.writeJSON(path, json)
  }
  write(path: string, content: string | Uint8Array) {
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
    log('read', path)
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
