/**
 * This thing fires up and begins listening to the queue
 */

import Compartment from './io/compartment.ts'
import {
  Dispatch,
  DispatchFunctions,
  IsolateReturn,
  Params,
  PID,
  PROCTYPE,
} from './constants.ts'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import IsolateApi from './isolate-api.ts'
import { assert } from 'std/assert/assert.ts'
import debug from '$debug'
import { ulid } from 'std/ulid/mod.ts'
const log = debug('AI:cradle')

class Cradle {
  #compartment!: Compartment
  #api!: IsolateApi
  static async create() {
    const cradle = new Cradle()
    cradle.#compartment = Compartment.create('artifact')
    const { fs } = memfs()
    // TODO pass a dispatch function in so it can call out to other pids
    cradle.#api = IsolateApi.create(fs)
    await cradle.#compartment.mount(cradle.#api)

    const functions = cradle.#compartment.functions(cradle.#api)
    assert(!functions.stop, 'stop is a reserved action')
    assert(!functions.dispatches, 'dispatches is a reserved action')
    Object.assign(cradle, functions)
    return cradle
  }
  stop() {
    return this.#compartment.unmount(this.#api)
  }
  async dispatches({ isolate, pid }: { isolate: string; pid: PID }) {
    // cradle side, since functions cannot be returned from isolate calls
    // TODO add a cache for this
    const apiSchema = await this.apiSchema({ isolate })
    const dispatches: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      dispatches[functionName] = (
        params: Params = {},
        proctype = PROCTYPE.SERIAL,
      ) => {
        const nonce = ulid()
        log('dispatch:', functionName, nonce)
        return this.dispatch({
          pid,
          isolate,
          functionName,
          params,
          proctype,
          nonce, // TODO this should be formulaic for chain to chain
        })
      }
    }
    log('dispatches:', isolate, Object.keys(dispatches))
    return dispatches
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
  clone(params: { repo: string }): Promise<void>
  apiSchema(params: { isolate: string }): Promise<Record<string, object>>
  dispatch(params: Dispatch): Promise<IsolateReturn>
}

export default Cradle
