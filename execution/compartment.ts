import napps from './napps-import.ts'
import type { Action } from '@artifact/api/actions'
import Debug from 'debug'
import { Trail } from './trail.ts'
import { assert } from '@std/assert/assert'
const log = Debug('AI:compartment')

// so it would only take in some actions and a filesystem, and it would
// return back the changed filesystem, replies to actions, and any new
// actions that need transmission, as well as indicating that it is time to
// end the execution.

export default class Compartment {
  static async load(napp: keyof typeof napps) {
    await Promise.resolve() // simulates loading from the network
    const compartment = new Compartment(napp)
    return compartment
  }
  #napp: typeof napps[keyof typeof napps]
  #trail: Trail | undefined

  private constructor(napp: keyof typeof napps) {
    log('load napp:', napp)
    this.#napp = napps[napp]
  }
  start(origin: Action) {
    assert(!this.#trail, 'Already running')
    this.#trail = Trail.create(origin)
    return this.#execute()
  }
  #execute() {
    // reject if it doesn't match this napp
    // execute the action
    // return the new trail?
  }
  increment(trail: Trail) {
    // error if we are not already running
    assert(this.#trail, 'Not running')
    // absorb the new trail
  }
  tearDown() {
  }
  /**
   * Mount the isolate as a side effect, and give it the chance to initialize
   * some context that will get passed between different invocations on the
   * same mount.
   * @param api : IsolateApi
   * @returns Promise<void> | void
   */
  mount(api: IA) {
    // TODO use exe to ensure that mount stops working arfter invocation
    this.#check()
    if (this.#napp.lifecycles) {
      if (typeof this.#napp.lifecycles['@@mount'] === 'function') {
        return this.#napp.lifecycles['@@mount'](api)
      }
    }
  }
  /**
   * Unmount the isolate as a side effect, and give it the chance to clean up
   * @param api : IsolateApi
   */
  unmount(api: IA) {
    this.#check()
    if (this.#napp.lifecycles) {
      if (typeof this.#napp.lifecycles['@@unmount'] === 'function') {
        return this.#napp.lifecycles['@@unmount'](api)
      }
    }
  }
}
