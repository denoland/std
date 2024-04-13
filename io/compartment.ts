import validator from './validator.ts'
import { assert, Debug } from '@utils'
import { Isolate, Params } from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'
import { DispatchFunctions } from '@/constants.ts'

const log = Debug('AI:compartment')
const cache = new Map()

export default class Compartment {
  #module: Isolate
  #check() {
    assert(this.#module, 'code not loaded')
  }
  private constructor(isolate: string) {
    log('load isolate:', isolate)
    assert(isolates[isolate as keyof typeof isolates], `not found: ${isolate}`)
    this.#module = isolates[isolate as keyof typeof isolates] as Isolate
    const { functions, api } = this.#module
    assert(typeof api === 'object', 'api not exported')
    assert(typeof functions === 'object', 'functions not exported')
    assert(Object.keys(this.#module.api).length, 'api not exported')
    const missing = Object.keys(api).filter((key) => !functions[key])
    assert(!missing.length, `Missing functions: ${missing.join(', ')}`)
  }
  static async create(isolate: string) {
    if (!cache.has(isolate)) {
      const compartment = new Compartment(isolate)
      cache.set(isolate, compartment)
      await Promise.resolve() // simulates loading from filesystem
    }
    return cache.get(isolate) as Compartment
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
  mount(api: IsolateApi) {
    // TODO use exe to ensure that mount stops working arfter invocation
    this.#check()
    if (!this.#module.lifecycles) {
      return
    }
    if (typeof this.#module.lifecycles['@@mount'] === 'function') {
      return this.#module.lifecycles['@@mount'](api)
    }
  }
  /**
   * Unmount the isolate as a side effect, and give it the chance to clean up
   * @param api : IsolateApi
   */
  unmount(api: IsolateApi) {
    this.#check()
    if (!this.#module.lifecycles) {
      return
    }
    if (typeof this.#module.lifecycles['@@unmount'] === 'function') {
      return this.#module.lifecycles['@@unmount'](api)
    }
  }
  functions<T = DispatchFunctions>(api: IsolateApi) {
    this.#check()
    const actions: DispatchFunctions = {}
    for (const functionName in this.#module.api) {
      actions[functionName] = (
        parameters?: Params,
      ) => {
        log('dispatch: %o', functionName)
        const schema = this.#module.api[functionName]
        if (parameters === undefined) {
          parameters = {}
        }
        validator(schema)(parameters)
        return this.#module.functions[functionName](parameters, api)
      }
    }
    return actions as T
  }
}
