import Compartment from './io/compartment.ts'
import {
  AudioPierceRequest,
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
import { transcribe } from '@/artifact/runners/runner-chat.ts'
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
  async stop() {
    await this.#compartment.unmount(this.#api)
    await this.#queue.quiesce()
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
        log('pierces %o', functionName)
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
  async pierce(params: PierceRequest) {
    try {
      return await this.#queue.push('pierce', params)
    } catch (error) {
      throw error
    } finally {
      // if we are in test mode, quiesce the queue before returning
      if (this.#api.context.db!.isTestMode) {
        await this.#queue.quiesce()
      }
    }
  }
  async audioPierce(params: AudioPierceRequest) {
    const { audioKey, audio, ...rest } = params
    const text = await transcribe(audio)
    const request = {
      ...rest,
      params: { ...params.params, [audioKey]: text },
    }
    return this.pierce(request)
  }
  request(params: { request: Request; commit: string; prior?: number }) {
    const detach = true
    return this.#queue.push('request', params, detach)
  }
  logs(params: { repo: string }) {
    return this.#queue.push('logs', params)
  }
}

interface Cradle {
  ping(params?: Params): Promise<IsolateReturn>
  init(params: { repo: string }): Promise<{ pid: PID }>
  clone(params: { repo: string }): Promise<{ pid: PID }>
  apiSchema(params: { isolate: string }): Promise<Record<string, object>>
  pierce(params: PierceRequest): Promise<IsolateReturn>
  audioPierce(params: AudioPierceRequest): Promise<IsolateReturn>
  logs(params: { repo: string }): Promise<object[]>
}

export default Cradle
