/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { Shell } from '@/api/web-client.ts'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import { load } from '$std/dotenv/mod.ts'
let introDone = false
const cradleMaker = async () => {
  const env = await load()
  const url = env.CLOUD_URL
  assert(url, 'CLOUD_URL not set')
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
  }
  const engine = WebClientEngine.create(url)
  const superuser = {
    id: '__system',
    account: 'system',
    repository: 'system',
    branches: ['main'],
  }
  const artifact = Shell.create(engine, superuser)
  return artifact
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
