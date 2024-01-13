import assert from 'assert-fast'
import Debug from 'debug'
const debug = Debug('AI:io-worker')
// TODO make this work in threadsjs
export default ({ fs, trigger, artifact }) => {
  // TODO inside isolation using unique hooks for each worker
  // TODO scope filesystem access
  globalThis['@@io-worker-hooks'] = {
    async writeJS(js, path) {
      // debug('writeJS', path)
      assert(path, 'path is required')
      const file = JSON.stringify(js, null, 2)
      await fs.writeFile(path, file)
      trigger.write(path, file)
    },
    async writeFile(file, path) {
      // debug('writeFile', path)
      assert(path, 'path is required')
      await fs.writeFile(path, file)
      trigger.write(path, file)
    },
    async readJS(path) {
      // debug('readJS', path)
      assert(path, 'path is required')
      const string = await fs.readFile(path, 'utf8')
      return JSON.parse(string)
    },
    async readFile(path) {
      // debug('readFile', path)
      assert(path, 'path is required')
      return fs.readFile(path, 'utf8')
    },
    async actions(path) {
      // TODO this is horrifically wrong
      // https://github.com/dreamcatcher-tech/artifact/issues/1
      return artifact.actions(path)
    },
  }
  // TODO useMemo  where it caches the result for recoverability by a commit
  // TODO make paradigm where heavy functions are replayable
  // TODO force the use of sideEffects for network calls

  let code
  return {
    async load(codePathSlug) {
      debug('load slug', codePathSlug)
      assert(!code, 'code already loaded')
      // TODO load from the git repo or some other path like a cdn
      // TODO deduplicate by codepath ?
      code = await import(`../isolates/${codePathSlug}.js`)
      const { functions, api } = code
      assert(typeof api === 'object', 'api not exported')
      assert(typeof functions === 'object', 'functions not exported')
      assert(Object.keys(code.api).length, 'api not exported')
      const missing = Object.keys(api).filter((key) => !functions[key])
      assert(!missing.length, `Missing APIs: ${missing.join(', ')}`)
      return api
    },
    async execute(functionName, parameters, config) {
      assert(code, 'code not loaded')
      const { functions } = code
      return Promise.resolve().then(() => {
        return functions[functionName](parameters, config)
      })
    },
  }
}
