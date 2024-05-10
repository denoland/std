/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import '@std/dotenv/load'
import { Machine } from '@/api/web-client-machine.ts'

let introDone = false

const cradleMaker = async () => {
  const url = Deno.env.get('CLOUD_URL')
  assert(url, 'CLOUD_URL not set')
  // TODO delete all repos that the actor has access to
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
    await WebClientEngine.provision(url)
    console.log('provisioning complete')
  }
  const engine = await WebClientEngine.start(url)
  const machine = Machine.load(engine)
  // TODO use the same keypair
  const session = machine.openSession()
  return session
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
