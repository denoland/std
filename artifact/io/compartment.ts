import validator from '@io/validator.js'
import { assert } from 'std/assert/mod.ts'
import debug from '$debug'
import {
  DispatchFunctions,
  Isolate,
  Params,
  PROCTYPE,
} from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'

const log = debug('AI:io-worker')

const compartment = () => {
  let module: Isolate
  return {
    load(isolate: string) {
      assert(!module, 'module already loaded: ' + isolate)
      log('load isolate:', isolate)
      module = isolates[isolate as keyof typeof isolates] as Isolate
      const { functions, api } = module
      assert(typeof api === 'object', 'api not exported')
      assert(typeof functions === 'object', 'functions not exported')
      assert(Object.keys(module.api).length, 'api not exported')
      const missing = Object.keys(api).filter((key) => !functions[key])
      assert(!missing.length, `Missing functions: ${missing.join(', ')}`)
      return api
    },
    /**
     * Mount the isolate as a side effect, and give it the chance to initialize
     * some context that will get passed between different invocations on the
     * same mount.
     * @param api : IsolateApi
     * @returns Promise<void> | void
     */
    mount(api: IsolateApi) {
      assert(module, 'code not loaded')
      if (!module.lifecycles) {
        return
      }
      if (typeof module.lifecycles['@@mount'] === 'function') {
        return module.lifecycles['@@mount'](api)
      }
    },
    /**
     * Unmount the isolate as a side effect, and give it the chance to clean up
     * @param api : IsolateApi
     */
    unmount(api: IsolateApi) {
      assert(module, 'code not loaded')
      if (!module.lifecycles) {
        return
      }
      if (typeof module.lifecycles['@@unmount'] === 'function') {
        return module.lifecycles['@@unmount'](api)
      }
    },
    actions(api: IsolateApi) {
      assert(module, 'code not loaded')
      const actions: DispatchFunctions = {}
      for (const functionName in module.api) {
        actions[functionName] = (parameters?: Params, proctype?: PROCTYPE) => {
          const schema = module.api[functionName]
          if (parameters === undefined) {
            parameters = {}
          }
          validator(schema)(parameters)
          return module.functions[functionName](parameters, api)
        }
      }
      return actions
    },
  }
}
export default compartment
