/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import '@std/dotenv/load'
import { Backchat } from '@/api/web-client-backchat.ts'

let introDone = false

const cradleMaker = async () => {
  const url = Deno.env.get('CLOUD_URL')
  assert(url, 'CLOUD_URL not set')
  const machineKey = Deno.env.get('CLOUD_MACHINE_KEY')
  assert(machineKey, 'CLOUD_MACHINE_KEY not set')

  const engine = await WebClientEngine.start(url)

  const backchat = await Backchat.upsert(engine, machineKey)
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
    const repos = await backchat.lsRepos()
    if (repos.length) {
      console.log('deleting repos:', repos)
      await backchat.rm({ all: true })

      const postRepos = await backchat.lsRepos()
      console.log('postRepos:', postRepos)
    }
  }
  return { backchat, engine }
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
