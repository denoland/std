import Compartment from './io/compartment.ts'
import {
  DispatchFunctions,
  IsolateReturn,
  Params,
  PID,
  PierceRequest,
  PROCTYPE,
  Request,
} from './constants.ts'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import IsolateApi from './isolate-api.ts'
import { assert } from 'std/assert/assert.ts'
import { Debug } from '@utils'
import { ulid } from 'std/ulid/mod.ts'
import Queue from './queue.ts'
import { C } from './isolates/artifact.ts'
const log = Debug('AI:cradle')

class Cradle {
  #compartment!: Compartment
  #api!: IsolateApi<C>
  #queue!: Queue
  static async create() {
    const cradle = new Cradle()
    cradle.#compartment = Compartment.create('artifact')
    const { fs } = memfs()
    // TODO pass a dispatch function in so it can call out to other pids
    cradle.#api = IsolateApi.create(fs)
    cradle.#api.context.self = cradle
    await cradle.#compartment.mount(cradle.#api)
    assert(cradle.#api.context.db, 'db not found')

    const functions = cradle.#compartment.functions(cradle.#api)
    assert(!functions.stop, 'stop is a reserved action')
    assert(!functions.dispatches, 'dispatches is a reserved action')
    cradle.#queue = Queue.create(functions, cradle.#api)
    return cradle
  }
  stop() {
    return this.#compartment.unmount(this.#api)
  }
  async pierces(isolate: string, target: PID) {
    // cradle side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params: Params = {},
        options?: { branch?: boolean },
      ) => {
        log('pierces %s', functionName)
        const proctype = options?.branch ? PROCTYPE.BRANCH : PROCTYPE.SERIAL
        const pierce: PierceRequest = {
          target,
          ulid: ulid(),
          isolate,
          functionName,
          params,
          proctype,
        }
        return this.pierce(pierce)
      }
    }
    log('dispatches:', isolate, Object.keys(pierces))
    return pierces
  }
  ping(params?: Params) {
    params = params || {}
    return this.#queue.push('ping', params)
  }
  init(params: { repo: string }) {
    return this.#queue.push('init', params)
  }
  clone(params: { repo: string }) {
    return this.#queue.push('clone', params)
  }
  apiSchema(params: { isolate: string }) {
    return this.#queue.push('apiSchema', params)
  }
  pierce(params: PierceRequest) {
    return this.#queue.push('pierce', params)
  }
  request(params: Request) {
    return this.#queue.push('request', params)
  }
}

interface Cradle {
  ping(params?: Params): Promise<IsolateReturn>
  init(params: { repo: string }): Promise<{ pid: PID }>
  clone(params: { repo: string }): Promise<{ pid: PID }>
  apiSchema(params: { isolate: string }): Promise<Record<string, object>>
  pierce(params: PierceRequest): Promise<IsolateReturn>
}

export default Cradle
