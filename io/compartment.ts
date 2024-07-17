import validator from './validator.ts'
import { assert, Debug } from '@utils'
import { Isolate, Params } from '@/constants.ts'
import IA from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'
import { DispatchFunctions } from '@/constants.ts'

const log = Debug('AI:compartment')
const cache = new Map<string, Compartment>()

export default class Compartment {
  #module: Isolate
  #isolate: string
  #check() {
    assert(this.#module, 'code not loaded')
  }
  private constructor(isolate: string) {
    log('load isolate:', isolate)
    assert(isolates[isolate as keyof typeof isolates], `not found: ${isolate}`)
    // TODO this is incredibly messy for types
    this.#module =
      isolates[isolate as keyof typeof isolates] as unknown as Isolate
    this.#isolate = isolate
    const { api, functions } = this.#module
    assert(typeof functions === 'object', 'functions not exported: ' + isolate)
    assert(typeof api === 'object', 'api not exported: ' + isolate)
    assert(Object.keys(this.#module.api).length, 'api not exported: ' + isolate)
    const missing = Object.keys(api).filter((key) => !functions[key])
    assert(!missing.length, `${isolate} Missing: ${missing.join(', ')}`)
  }
  static async create(isolate: string) {
    if (!cache.has(isolate)) {
      const compartment = new Compartment(isolate)
      cache.set(isolate, compartment)
      await Promise.resolve() // simulates loading from filesystem
    }
    const compartment = cache.get(isolate)
    assert(compartment, 'compartment not found: ' + isolate)
    return compartment
  }
  get api() {
    this.#check()
    return this.#module.api
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
    if (this.#module.lifecycles) {
      if (typeof this.#module.lifecycles['@@mount'] === 'function') {
        return this.#module.lifecycles['@@mount'](api)
      }
    }
  }
  /**
   * Unmount the isolate as a side effect, and give it the chance to clean up
   * @param api : IsolateApi
   */
  unmount(api: IA) {
    this.#check()
    if (this.#module.lifecycles) {
      if (typeof this.#module.lifecycles['@@unmount'] === 'function') {
        return this.#module.lifecycles['@@unmount'](api)
      }
    }
  }
  functions<T = DispatchFunctions>(api: IA) {
    this.#check()
    const actions: DispatchFunctions = {}
    for (const functionName in this.#module.api) {
      actions[functionName] = this.#toFunction(functionName, api)
    }
    return actions as T
  }
  #toFunction(functionName: string, api: IA) {
    return (
      parameters?: Params,
    ) => {
      log('dispatch: %o', functionName)
      if (parameters === undefined) {
        parameters = {}
      }
      // TODO re-enable after perf testing
      const schema = this.#module.api[functionName]
      const path = this.#isolate + '/' + functionName
      validator(schema, path)(parameters)
      return this.#module.functions[functionName](parameters, api)
    }
  }
}
