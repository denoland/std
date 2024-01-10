import assert from 'assert-fast'

// TODO document new covenant format

export const api = {
  ping: {
    type: 'object',
    properties: { url: { type: 'string' } },
  },
  local: {
    type: 'object',
    properties: {},
  },
}

export const functions = {
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
}
