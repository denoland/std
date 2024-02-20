import 'npm:supports-color'
export { expect } from 'std/expect/mod.ts'
export { assert } from 'std/assert/assert.ts'

import Debug from 'npm:debug'
Debug.enable('')
export { Debug }
export const log = Debug('AI:tests')

const isDenoDeploy = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined
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
  return Deno.openKv(path)
}
