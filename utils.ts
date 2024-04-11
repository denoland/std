export { equal } from 'https://deno.land/x/equal/mod.ts'
export { delay } from '$std/async/mod.ts'
import 'npm:supports-color'
export { expect } from 'std/expect/mod.ts'
export { assert, AssertionError } from 'std/assert/mod.ts'
export { default as merge } from 'npm:lodash.merge'
import Debug from 'npm:debug'
import { Outcome, PID } from '@/constants.ts'
import { deserializeError, serializeError } from 'serialize-error'
import { ulid } from 'std/ulid/mod.ts'
export { ulid }
export { deserializeError, serializeError }
export { Debug }
const _log = Debug('AI:tests')
export const log = (...args: unknown[]) => {
  _log(...args)
}
log.enable = (...args: string[]) => {
  Debug.enable(...args)
}
export * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
export const sha1 = /^[0-9a-f]{40}$/i

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
export const fromOutcome = (outcome: Outcome) => {
  if (outcome.error) {
    throw deserializeError(outcome.error)
  }
  return outcome.result
}
export const print = (pid: PID) => {
  const branches = pid.branches.join(':')
  return `${pid.account}/${pid.repository}:${branches}`
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
