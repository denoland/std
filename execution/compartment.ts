import napps from './napps-import.ts'
import type { NappApi } from '@artifact/api/napp-api'
import Debug from 'debug'
import type { Trail } from './trail.ts'
import { assert } from '@std/assert/assert'
import { Api } from './api.ts'

const log = Debug('@artifact/execution')

export default class Compartment {
  static async load(napp: keyof typeof napps, trail: Trail) {
    await Promise.resolve() // simulates loading from the network
    const compartment = new Compartment(napp, trail)
    compartment.#execute()
    return compartment
  }

  // TODO figure out how to do types cleanly
  // deno-lint-ignore ban-types
  #napp: Record<string, Function>

  readonly #trail: Trail

  private constructor(napp: keyof typeof napps, trail: Trail) {
    log('load napp:', napp, trail)
    if (napp !== trail.origin.napp) {
      throw new Error('Napp mismatch: ' + napp + ' !== ' + trail.origin.napp)
    }
    this.#napp = napps[napp]
    this.#trail = trail
    trail.signal.onabort = () => this.#tearDown()
  }
  async #execute() {
    await this.#trail.waitForActivation()
    try {
      const { tool } = this.#trail.origin
      log('execute', tool)
      if (!(tool in this.#napp)) {
        throw new Error('Tool not found: ' + tool)
      }
      if (typeof this.#napp[tool] !== 'function') {
        throw new Error('Tool is not a function: ' + tool)
      }

      const api = Api.create(this.#trail)
      const result = await this.#napp[tool](this.#trail.origin.parameters, api)
      this.#trail.resolve(result)
    } catch (error) {
      this.#trail.reject(error as Error)
    }
  }
  // what about holding off on the outcome until all the actions were
  // transmitted ?
  // how to send of actions that have no reply ?
  // what if the function completes AFTER the trail trigger ?

  // test firing off some promises then returning, and it should skip those
  // promises as well as ignoring their return values

  #tearDown() {
    log('tear down')
    return Promise.resolve()
  }
  /**
   * Mount the isolate as a side effect, and give it the chance to initialize
   * some context that will get passed between different invocations on the
   * same mount.
   * @param api : IsolateApi
   * @returns Promise<void> | void
   */
  mount(api: NappApi) {
    // TODO use exe to ensure that mount stops working arfter invocation
    if ('@@mount' in this.#napp) {
      assert(typeof this.#napp['@@mount'] === 'function', 'Invalid mount')
      return this.#napp['@@mount'](api)
    }
  }
  /**
   * Unmount the isolate as a side effect, and give it the chance to clean up
   * @param api : IsolateApi
   */
  unmount(api: NappApi) {
    if ('@@unmount' in this.#napp) {
      assert(typeof this.#napp['@@unmount'] === 'function', 'Invalid unmount')
      return this.#napp['@@unmount'](api)
    }
  }
}
