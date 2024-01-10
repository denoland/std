import assert from 'assert-fast'

// TODO make this work in threadsjs
export default ({ fs, trigger }) => {
  // TODO inside isolation using unique hooks for each worker
  // TODO scope filesystem access
  if (!globalThis['@@io-worker-hooks']) {
    globalThis['@@io-worker-hooks'] = {
      async write(js, path) {
        assert(path, 'path is required')
        const string = JSON.stringify(js, null, 2)
        await fs.writeFile(path, string)
        trigger.write(path, js)
      },
      async read(path) {
        assert(path, 'path is required')
        const string = await fs.readFile(path, 'utf8')
        return JSON.parse(string)
      },
      async readFile(path) {
        assert(path, 'path is required')
        return fs.readFile(path, 'utf8')
      },
    }
  }

  let code
  return {
    async load(codePath) {
      assert(!code, 'code already loaded')
      // TODO load from the git repo or some other path like a cdn
      // TODO deduplicate by codepath ?
      code = await import(codePath)
      const { functions, api } = code
      assert(typeof functions === 'object', 'functions not exported')
      assert(typeof api === 'object', 'api not exported')
      assert(Object.keys(code.api).length, 'api not exported')
      const exported = Object.keys(api).every((key) => functions[key])
      assert(exported, 'api not exported')
      return api
    },
    async call(functionName, parameters, config) {
      assert(code, 'code not loaded')
      const { functions } = code
      return Promise.resolve().then(() => {
        return functions[functionName](parameters, config)
      })
    },
  }
}
