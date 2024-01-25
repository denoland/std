import assert from 'assert-fast'
import { functions as fetch } from './fetch'
import Debug from 'debug'
const debug = Debug('AI:oauth')

export const api = {
  authenticate: {
    description: `Will check if there is a token in .env first, and if there is, will check its validity against github.com.  If there is no valid token present, it will open a browser window and walk through the oauth dance to get a token.  It will then store that token in .env and return { validToken: true }`,
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}
export const functions = {
  authenticate: async () => {
    // check if we have a token already
    // check if that token is valid
    // if not, do the oauth loop
    // if the dance finishes successfully,
    // perform a refresh on the system like profile pic

    await loop()
    return { validToken: true }
  },
}

export const loop = async () => {
  const fnName = '@@oauth-code'
  assert(!globalThis[fnName], 'oauth-code function already exists')
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  globalThis[fnName] = async (code) => {
    console.log('overridden oauth-code function', code, typeof code)
    debug('received back github auth code')

    // do the fetch call to the web server to get the token
    const data = { code }
    if (isRunningOnLocalhost()) {
      data.mode = 'development'
    }
    const url = 'https://aritfact-github-auth.deno.dev'
    const result = await fetch.post({ url, data })
    console.log('result', result)

    delete globalThis[fnName]
  }

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const scope = encodeURIComponent('user,repo')
  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`
  // TODO add state callback check
  openOAuthWindow(oauthUrl, 'Github OAuth')
  return promise
}

function openOAuthWindow(oauthUrl, name) {
  const width = 600
  const height = 1100
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2
  const windowFeatures = `toolbar=no, menubar=no, width=${width}, height=${height}, top=${top}, left=${left}`

  window.open(oauthUrl, name, windowFeatures)
}

function isRunningOnLocalhost() {
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  )
}
