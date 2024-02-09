/**
 * This thing fires up and begins listening to the queue
 */

import Compartment from './io/compartment.ts'
import {
  DispatchFunctions,
  IsolateReturn,
  Params,
  PID,
  PROCTYPE,
} from './constants.ts'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import IsolateApi from './isolate-api.ts'
import { assert } from 'std/assert/assert.ts'

type Actions = { isolate: string; pid: PID }
class Cradle {
  #compartment!: Compartment
  #context!: IsolateApi
  static async create() {
    const cradle = new Cradle()
    cradle.#compartment = Compartment.create('artifact')
    const { fs } = memfs()
    // TODO pass a dispatch function in so it can call out to other pids
    cradle.#context = IsolateApi.create(fs)
    await cradle.#compartment.mount(cradle.#context)

    const actions = cradle.#compartment.actions(cradle.#context)
    assert(!actions.stop, 'stop is a reserved action')
    assert(!actions.actions, 'actions is a reserved action')
    Object.assign(cradle, actions)
    return cradle
  }
  stop() {
    this.#compartment.unmount(this.#context)
  }
  actions({ isolate, pid }: Actions) {
    // get the api by doing a remote queue call
    // then wrap each function with a dispatch call
  }
}

// then the hono api server would feed its json requests into the cradle, where
// they will get run.

// the hono api might need to wrap subscriptions and listen in to the broadcast
// channel that will be used to send out the patches.

interface Cradle {
  ping(params: Params): Promise<IsolateReturn>
  ping(params: Params, api: IsolateApi): Promise<IsolateReturn>
  clone(params: { repo: string }): Promise<void>
  isolateApi(params: { isolate: string }): Promise<Record<string, object>>
  dispatch(params: { isolate: string; pid: PID }): Promise<IsolateReturn>
}

export default Cradle
