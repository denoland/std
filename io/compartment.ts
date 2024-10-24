import { assert, Debug } from '@utils'
import { Isolate, Params, toApi } from '@/constants.ts'
import IA from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'
import { DispatchFunctions } from '@/constants.ts'
import { ZodSchema } from 'zod'

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
    const { parameters, returns, functions } = this.#module
    assert(typeof parameters === 'object', 'no parameters exported: ' + isolate)
    assert(typeof returns === 'object', 'no returns exported: ' + isolate)

    zodCheck(parameters, returns, isolate)
    assert(typeof functions === 'object', 'functions not exported: ' + isolate)
    const missing = Object.keys(parameters).filter((key) => !functions[key])
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
    return toApi(this.#module.parameters)
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
    for (const functionName in this.#module.parameters) {
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
      const schema = this.#module.parameters[functionName]
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
        this.#module.functions[functionName](parameters, api),
      )
        .then((result) => {
          const schema = this.#module.returns[functionName]
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
const zodCheck = (
  parameters: Record<string, ZodSchema>,
  returns: Record<string, ZodSchema>,
  isolate: string,
) => {
  assert(Object.keys(parameters).length, 'no api exported: ' + isolate)
  assert(
    Object.keys(returns).length === Object.keys(parameters).length,
    'parameters do not match returns: ' + isolate,
  )

  for (const key in parameters) {
    assert(parameters[key] instanceof ZodSchema, 'invalid schema: ' + key)
    assert(returns[key] instanceof ZodSchema, 'invalid schema: ' + key)
  }
}
