import type { Napp } from '@artifact/napp-tools'
import { assert } from '@std/assert'
import Debug from 'debug'
import { ZodSchema } from 'zod'

// deno has no dynamic runtime imports, so this is a workaround
import napps from './napps-import.ts'

const log = Debug('AI:compartment')
const cache = new Map<string, Compartment>()

// needs to be extended to handle file calls coming in too

export default class Compartment {
  #napp: Napp
  #isolate: string
  #check() {
    assert(this.#napp, 'code not loaded')
  }
  private constructor(napp: keyof typeof napps) {
    log('load napp:', napp)
    this.#napp = napps[napp]
    this.#isolate = napp
    const { parameters, returns, functions } = this.#napp
    assert(typeof parameters === 'object', 'no parameters exported: ' + napp)
    assert(typeof returns === 'object', 'no returns exported: ' + napp)

    zodCheck(parameters, returns, napp)
    assert(typeof functions === 'object', 'functions not exported: ' + napp)
    const missing = Object.keys(parameters).filter((key) => !functions[key])
    assert(!missing.length, `${napp} Missing: ${missing.join(', ')}`)
  }
  static async load(napp: keyof typeof napps) {
    if (!cache.has(napp)) {
      const compartment = new Compartment(napp)
      cache.set(napp, compartment)
      await Promise.resolve() // simulates loading from the network
    }
    const compartment = cache.get(napp)
    assert(compartment instanceof Compartment, 'napp not found: ' + napp)
    return compartment
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
  functions<T = DispatchFunctions>(api: IA) {
    this.#check()
    const actions: DispatchFunctions = {}
    for (const functionName in this.#napp.parameters) {
      actions[functionName] = this.#toFunction(functionName, api)
    }
    return actions as T
  }
  #toFunction(functionName: string, api: IA) {
    return (parameters?: Params) => {
      log('dispatch: %o', functionName)
      if (parameters === undefined) {
        parameters = {}
      }
      const schema = this.#napp.parameters[functionName]
      const path = this.#isolate + '/' + functionName
      try {
        schema.parse(parameters)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        throw new Error(
          `Zod schema parameters validation error at path: ${path}\nError: ${message}`,
        )
      }
      return Promise.resolve(
        this.#napp.functions[functionName](parameters, api),
      )
        .then((result) => {
          const schema = this.#napp.returns[functionName]
          const parsed = schema.safeParse(result)
          if (!parsed.success) {
            throw new Error(
              `Unrecoverable system error in ${path}. ${parsed.error.message}`,
            )
          }
          return result
        })
    }
  }
}
