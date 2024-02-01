import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from '$debug'
const log = debug('AI:io-worker')
export default (api) => {
  globalThis['@@io-worker-hooks'] = {
    async writeJS(path, js) {
      // debug('writeJS', path)
      assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
      const file = JSON.stringify(js, null, 2)
      await api.write(path, file)
    },
    async write(path, file) {
      // debug('write', path)
      assert(path, 'path is required')
      await api.write(path, file)
    },
    async readJS(path) {
      // debug('readJS', path)
      assert(path, 'path is required')
      const string = await api.read(path)
      return JSON.parse(string)
    },
    async read(path) {
      return api.read(path)
    },
    async inBand(isolate) {
      return api.inBand(isolate)
    },
    async spawns(isolate) {
      return api.spawns(isolate)
    },
    async isFile(path) {
      try {
        await api.stat(path)
        return true
      } catch (err) {
        if (err.code === 'ENOENT') {
          return false
        }
        throw err
      }
    },
    async ls(path) {
      return api.ls(path)
    },
    async rm(path) {
      return api.rm(path)
    },
  }
  // TODO useMemo  where it caches the result for recoverability by a commit
  // TODO make paradigm where heavy functions are replayable
  // TODO force the use of sideEffects for network calls

  let code
  return {
    async load(isolate) {
      log('load isolate', isolate)
      assert(!code, 'code already loaded')
      // TODO load from the git repo or some other path like a cdn
      code = await import(`../isolates/${isolate}.js`)
      const { functions, api } = code
      assert(typeof api === 'object', 'api not exported')
      assert(typeof functions === 'object', 'functions not exported')
      assert(Object.keys(code.api).length, 'api not exported')
      const missing = Object.keys(api).filter((key) => !functions[key])
      assert(!missing.length, `Missing functions: ${missing.join(', ')}`)
      return api
    },
    // async snapshot() => { execute: () => execute once within the snapshot }

    async execute(functionName, parameters) {
      // this execution must be tied to an isolated fs
      assert(code, 'code not loaded')
      const { functions } = code
      return Promise.resolve().then(() => {
        return functions[functionName](parameters, config)
      })
    },
  }
}
