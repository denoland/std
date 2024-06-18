export { default as equal } from 'fast-deep-equal/es6'
export { delay } from '@std/async'
export { expect } from '@std/expect'
export { assert, AssertionError } from '@std/assert'
export { default as merge } from 'lodash.merge'
import 'supports-color'
import Debug from 'debug'
import { deserializeError, serializeError } from 'serialize-error'
export { deserializeError, serializeError }
export { Debug }
const _log = Debug('AI:tests')
export const log = (...args: unknown[]) => {
  _log(...args)
}
log.enable = (...args: string[]) => {
  Debug.enable(...args)
}
export * as posix from '@std/path/posix'

const isDenoDeploy = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined
let _isTestMode = false
export const isKvTestMode = () => {
  return _isTestMode
}
export const openKv = async () => {
  if (isDenoDeploy) {
    return Deno.openKv()
  }
  const KEY = 'DENO_KV_PATH'
  let path = ':memory:'
  const permission = await Deno.permissions.query({
    name: 'env',
    variable: KEY,
  })
  if (permission.state === 'granted') {
    const env = Deno.env.get(KEY)
    if (env) {
      path = env
    }
  }
  log('open kv', path)
  _isTestMode = path === ':memory:'
  return Deno.openKv(path)
}
const getDebug = () => {
  if (isDenoDeploy) {
    const string = Deno.env.get('DEBUG')
    if (string) {
      return string
    }
  }
  return ''
}

Debug.enable(getDebug())
