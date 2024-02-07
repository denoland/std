import validator from '@io/validator.js'
import { assert } from 'std/assert/mod.ts'
import { debug } from '$debug'
import { Isolate, IsolatedFunctions, Parameters } from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'

// deno has no dynamic runtime imports, so this is a workaround
import isolates from '../isolates/index.ts'

const log = debug('AI:io-worker')

const worker = () => {
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
    actions(api: IsolateApi) {
      assert(module, 'code not loaded')
      const actions: IsolatedFunctions = {}
      for (const functionName in module.api) {
        actions[functionName] = (parameters?: Parameters) => {
          const schema = module.api[functionName]
          validator(schema)(parameters)
          return module.functions[functionName](parameters, api)
        }
      }
      return actions
    },
  }
}
export default worker
