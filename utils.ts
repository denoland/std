import { EventSourceParserStream } from 'npm:eventsource-parser/stream'
export { equal } from 'https://deno.land/x/equal/mod.ts'
export { delay } from '$std/async/mod.ts'
import 'npm:supports-color'
export { expect } from 'std/expect/mod.ts'
export { assert } from 'std/assert/assert.ts'
export { default as merge } from 'npm:lodash.merge'
import Debug from 'npm:debug'
import { JsonValue, Outcome, PID } from '@/constants.ts'
import {
  deserializeError,
  serializeError,
} from 'https://esm.sh/v135/serialize-error@11.0.3/index.js'
export { deserializeError, serializeError }
export { Debug }
export const log = Debug('AI:tests')
export * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'

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
    const result = await promise
    // TODO do not squelch ts errors
    outcome.result = result as JsonValue
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

export const toEvents = (stream: ReadableStream) =>
  stream.pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
