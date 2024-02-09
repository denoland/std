/**
 * This thing fires up and begins listening to the queue
 */

import compartment from './io/compartment.ts'
import { DispatchFunctions, PROCTYPE } from './constants.ts'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import IsolateApi from './isolate-api.ts'

export default async function cradle() {
  const instance = compartment()
  instance.load('artifact')
  const { fs } = memfs()
  // pass a dispatch function in so it can call out to other pids
  const api = IsolateApi.create(fs)
  await instance.mount(api)

  const actions = instance.actions(api)
  actions.stop = () => instance.unmount(api)
  return actions
}

// then the hono api server would feed its json requests into the cradle, where
// they will get run.

// the hono api might need to wrap subscriptions and listen in to the broadcast
// channel that will be used to send out the patches.
