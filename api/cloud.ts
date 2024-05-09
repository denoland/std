/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import { load } from '@std/dotenv'
import { SUPERUSER } from '@/constants.ts'
import { Machine } from '@/api/web-client-home.ts'
let introDone = false
const cradleMaker = async () => {
  const env = await load()
  const url = env.CLOUD_URL
  assert(url, 'CLOUD_URL not set')
  // TODO delete all repos that the actor has access to
  const engine = WebClientEngine.start(url)
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
    const result = await engine.provision()
    console.log('initialization:', result)
  }
  const home = Machine.resumeSession(engine, SUPERUSER)
  const artifact = await home.createSession()
  return artifact
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
