import assert from 'assert-fast'
import { expose } from 'threads/worker'

expose({
  async ping({ url }) {
    assert(url, 'url required')
    assert(url.startsWith('http'), 'url must start with http')
    const start = Date.now()
    const response = await fetch(url)
    console.log(response)
    const end = Date.now()
    return end - start
  },
  local() {
    return 'local reply'
  },
})
