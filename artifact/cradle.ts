import Compartment from './io/compartment.ts'
import {
  DispatchFunctions,
  IsolateReturn,
  Params,
  PID,
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
  async dispatches(isolate: string, target: PID) {
    // cradle side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const dispatches: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      dispatches[functionName] = (
        params: Params = {},
        options?: { branch?: boolean },
      ) => {
        log('dispatch:', functionName)
        const proctype = options?.branch ? PROCTYPE.BRANCH : PROCTYPE.SERIAL
        const nonce = ulid()
        const request: Request = {
          target,
          source: { nonce },
          isolate,
          functionName,
          params,
          proctype,
        }
        return this.pierce(request, this.#api)
      }
    }
    log('dispatches:', isolate, Object.keys(dispatches))
    return dispatches
  }
  ping(params?: Params) {
    params = params || {}
    return this.#queue.push('ping', params)
  }
}

// the hono api might need to wrap subscriptions and listen in to the broadcast
// channel that will be used to send out the patches.
// subscriptions will be the PID broadcast channel, which updates while someone
// has headlock and at each commit.
// detecting headlock means we would expect a message to come down, triggering
// the splice status to be updated to 'executing'
// the first thing to do after getting headlock is to broadcast out that you
// have it.
// Could broadcast io sequence changes and also file path changes up to a
// certain size, and indicate consumers need to pull the commit if the change
// set is too big

interface Cradle {
  ping(params?: Params): Promise<IsolateReturn>
  init(params: { repo: string }): Promise<{ pid: PID }>
  clone(params: { repo: string }): Promise<{ pid: PID }>
  apiSchema(params: { isolate: string }): Promise<Record<string, object>>
  pierce(params: Request, api: IsolateApi): Promise<IsolateReturn>
}

export default Cradle
