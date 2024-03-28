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
  PROCTYPE,
  SolidRequest,
} from '@/constants.ts'
import FS from '@/git/fs.ts'
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}

export default class IsolateApi<T extends object = Default> {
  #fs: FS
  #accumulator: Accumulator
  #accumulatorCount = 0
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  private constructor(fs: FS, accumulator: Accumulator) {
    this.#fs = fs
    this.#accumulator = accumulator
  }
  static create(fs: FS, accumulator: Accumulator) {
    return new IsolateApi(fs, accumulator)
  }
  static createContext() {
    // TODO find a more graceful way to do this for cradle setup
    return new IsolateApi(null as unknown as FS, null as unknown as Accumulator)
  }
  get pid() {
    return this.#fs.pid
  }
  // TODO make targetPID be required, as error to dispatch serially to self
  async actions(isolate: string, targetPID?: PID) {
    const target = targetPID ? targetPID : this.pid
    log('actions', isolate, print(target))
    const schema = await this.isolateApiSchema(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(schema)) {
      actions[functionName] = (params?: Params, options?: ProcessOptions) => {
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
        if (equal(target, this.pid) && proctype === PROCTYPE.SERIAL) {
          return Promise.reject(new Error('cannot dispatch to self'))
        }
        const request: SolidRequest = {
          target,
          source: this.pid,
          sequence: this.#accumulatorCount++,

          isolate,
          functionName,
          params: params || {},
          proctype,
        }
        const recovered = this.#accumulator.recover(request.sequence)
        if (recovered) {
          if (!equal(recovered.request, request)) {
            console.dir('recovered', recovered.request)
            console.dir('request', request)
          }
          assert(equal(recovered.request, request), 'request mismatch')
          const { outcome } = recovered
          if (outcome) {
            return Promise.resolve().then(() => fromOutcome(outcome))
          }
        }

        const promise = new Promise((resolve, reject) => {
          this.#accumulator!.push({ request, resolve, reject })
        })
        return promise
      }
    }

    return actions
  }
  /**
   * Used to call the functions of an isolate purely, without going thru the IO
   * subsystem which would otherwise cost a commit to the chain.
   * @param isolate The name of the isolate to load the functions for
   * @returns An object keyed by API function name, with values being the
   * function itself.
   */
  async functions(isolate: string) {
    // TODO these need some kind of PID attached ?
    const compartment = await Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions(this)
  }
  async isolateApiSchema(isolate: string) {
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  writeJSON(path: string, json: JsonValue) {
    log('writeJSON', path)
    this.#fs.writeJSON(path, json)
  }
  write(path: string, content: string | Uint8Array) {
    log('write', path)
    this.#fs.write(path, content)
    // TODO strip out accumulator usage of writes
    // only the beacon matters, as accumulation does not apply to writes
    if (this.#accumulator) {
      this.#accumulator.write(path, content)
    }
  }
  readJSON<T>(path: string): Promise<T> {
    log('readJSON', path)
    return this.#fs.readJSON<T>(path)
  }
  read(path: string) {
    log('read', path)
    return this.#fs.read(path)
  }
  readBinary(path: string) {
    log('readBinary', path)
    return this.#fs.readBinary(path)
  }
  exists(path: string) {
    log('exists', path)
    return this.#fs.exists(path)
  }
  ls(path: string) {
    // TODO make a streaming version of this for very large dirs
    log('ls', path)
    return this.#fs.ls(path)
  }
  delete(filepath: string) {
    log('delete', filepath)
    return this.#fs.delete(filepath)
  }
  get context() {
    // TODO at creation, this should flag context capable and reject if not
    return this.#context
  }
  set context(context: Partial<T>) {
    assert(typeof context === 'object', 'context must be an object')
    assert(context !== null, 'context must not be null')
    this.#context = context
  }
}
