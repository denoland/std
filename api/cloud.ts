/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert, deserializeError } from '@utils'
import WebClient from '@/api/web-client.ts'
import guts from '../guts/guts.ts'
import { load } from '$std/dotenv/mod.ts'
const cradleMaker = async () => {
  const env = await load()
  const url = env.CLOUD_URL
  assert(url, 'CLOUD_URL not set')
  const cradle = new WebClient(url, deserializeError)
  return cradle
}
guts('Cloud', cradleMaker)
