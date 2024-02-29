import validator from './validator.ts'
import { assert } from 'std/assert/mod.ts'
import { Debug } from '@utils'
import { DispatchFunctions, Isolate, Params } from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'

const log = Debug('AI:compartment')
const cache = new Map()

export default class Compartment {
  #module!: Isolate
  #check() {
    assert(this.#module, 'code not loaded')
  }
  static async create(isolate: string) {
    if (!cache.has(isolate)) {
      const compartment = new Compartment()
      compartment.#load(isolate)
      cache.set(isolate, compartment)
    }
    await Promise.resolve() // simulates loading from filesystem
    return cache.get(isolate)
  }
  get api() {
    this.#check()
    return this.#module.api
  }
  #load(isolate: string) {
    assert(!this.#module, 'module already loaded: ' + isolate)
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
  /**
   * Mount the isolate as a side effect, and give it the chance to initialize
   * some context that will get passed between different invocations on the
   * same mount.
   * @param api : IsolateApi
   * @returns Promise<void> | void
   */
  mount(api: IsolateApi) {
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
  functions(api: IsolateApi) {
    this.#check()
    const actions: DispatchFunctions = {}
    for (const functionName in this.#module.api) {
      actions[functionName] = (parameters?: Params) => {
        log('dispatch: %o', functionName)
        const schema = this.#module.api[functionName]
        if (parameters === undefined) {
          parameters = {}
        }
        validator(schema)(parameters)
        return this.#module.functions[functionName](parameters, api)
      }
    }
    return actions
  }
}
