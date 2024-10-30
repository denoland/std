import type { Napp } from '@artifact/napp-tools'
import { assert } from '@std/assert'
import Debug from 'debug'
import napps from './napps-import.ts'

const log = Debug('AI:compartment')

// needs to be extended to handle file calls coming in too

export default class Compartment {
  #napp: typeof napps[keyof typeof napps]
  private constructor(napp: keyof typeof napps) {
    log('load napp:', napp)

    // we are responsible for running only the functions this napp holds

    // so it would only take in some actions and a filesystem, and it would
    // return back the changed filesystem, replies to actions, and any new
    // actions that need transmission, as well as indicating that it is time to
    // end the execution.

    // in the compartment, we would hand in an api object, and the parameters of
    // the request.  this api object might include prior responses.

    // so if we have one running, we should be able to update the api that was
    // passed in with further results, and observe the result

    // need to pause execution and have it come back ?

    this.#napp = napps[napp]
    // TODO verify the napp has loaded and is valid ?
  }
  static async load(napp: keyof typeof napps) {
    await Promise.resolve() // simulates loading from the network
    const compartment = new Compartment(napp)
    return compartment
  }
  async execute(action)
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
  functions() {
    // this should return action creators that actually execute ?
    // how to add the files to the compartment ?
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
