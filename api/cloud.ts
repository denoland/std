/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { Session } from './web-client-session.ts'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import { load } from '@std/dotenv'
import { SUPERUSER } from '@/constants.ts'
let introDone = false
const cradleMaker = async () => {
  const env = await load()
  const url = env.CLOUD_URL
  assert(url, 'CLOUD_URL not set')
  const engine = WebClientEngine.create(url)
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
    const result = await engine.initialize()
    console.log('initialization:', result)
  }
  const artifact = Session.create(engine, SUPERUSER)
  return artifact
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
