export { equal } from 'https://deno.land/x/equal/mod.ts'
import 'npm:supports-color'
export { expect } from 'std/expect/mod.ts'
export { assert } from 'std/assert/assert.ts'
export { default as merge } from 'npm:lodash.merge'
import Debug from 'npm:debug'
import { Outcome, PID } from '@/constants.ts'
import {
  deserializeError,
  serializeError,
} from 'https://esm.sh/v135/serialize-error@11.0.3/index.js'
export { deserializeError, serializeError }
export { Debug }
export const log = Debug('AI:tests')

const isDenoDeploy = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined
let _isTestMode = false
export const isTestMode = () => {
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
export const asOutcome = async (promise: Promise<unknown>) => {
  const outcome: Outcome = {}
  try {
    outcome.result = await promise
  } catch (error) {
    outcome.error = serializeError(error)
  }
  return outcome
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
// Debug.enable('*exe *runner-chat')
