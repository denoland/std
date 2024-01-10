import assert from 'assert-fast'
import { expose } from 'threads/worker'

let code

expose({
  async load(codePath) {
    assert(!code, 'code already loaded')
    // TODO load from the git repo or some other path like a cdn
    code = await import(codePath)
  },
  async call({ functionName, parameters }) {
    assert(code, 'code not loaded')
    const result = await code[functionName](parameters)
    return result
  },
})
