import assert from 'assert-fast'
import { functions as fetch } from './fetch'
import { write, read } from '../artifact/io-hooks'
import Debug from 'debug'
const debug = Debug('AI:oauth')

export const api = {
  authenticate: {
    description: `Opens a browser popup window and walk through the oauth dance to get a token.  It will then store that token in .env and return { validToken: true }.  Make sure popups are not being blocked for the current window or this will not work.`,
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  testGithubAccess: {
    description: `Will check to see if the token in .env is valid by making a call to github.com.  If it is valid, it will return { validToken: true }`,
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

    await forkRepo('dreamcatcher-tech', 'artifact')

    return { validToken: true }
  },
  testGithubAccess: async () => {
    // maybe should have a github isolate that does github commands ?
  },
}

async function forkRepo(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/forks`

  const env = await read('/.env')
  const [key, token] = env.split('=')
  assert(key === 'GITHUB_PAT', `missing GITHUB_PAT in /.env: ${env}`)

  const options = {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  }

  globalThis
    .fetch(url, options)
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error('Error:', error))
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
    debug('received back github auth code')

    try {
      const data = { code }
      if (isRunningOnLocalhost()) {
        data.mode = 'development'
      }
      const url = 'https://artifact-github-auth.deno.dev'
      const result = await fetch.post({ url, data })

      await write('/.env', `GITHUB_PAT=${result.access_token}\n`)
      delete globalThis[fnName]
      resolve(
        'token written to "/.env" with "GITHUB_PAT=${result.access_token}\n"'
      )
    } catch (error) {
      delete globalThis[fnName]
      reject(error)
    }
  }

  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const scope = encodeURIComponent('read:user,repo')
  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`
  // TODO add state callback check for cross site forgery
  const openedWindow = openOAuthWindow(oauthUrl, 'Github OAuth')
  if (!openedWindow) {
    delete globalThis[fnName]
    reject('window.open failed - popup blocked ?')
  }
  return promise
}

function openOAuthWindow(oauthUrl, name) {
  const width = 600
  const height = 1100
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2
  const windowFeatures = `toolbar=no, menubar=no, width=${width}, height=${height}, top=${top}, left=${left}`

  return window.open(oauthUrl, name, windowFeatures)
}

function isRunningOnLocalhost() {
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  )
}
