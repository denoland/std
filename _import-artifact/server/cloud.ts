/**
 * Tests the deployed instance in deno cloud.
 * Not part of regular testing since can only run after the code is deployed
 */
import { assert } from '@utils'
import { WebClientEngine } from '../api/client-engine.ts'
import guts from '../guts/guts.ts'
import '@std/dotenv/load'
import { Backchat } from '../api/client-backchat.ts'
import type { CradleMaker } from '@/constants.ts'

let introDone = false

const cradleMaker: CradleMaker = async () => {
  const url = Deno.env.get('CLOUD_URL')
  assert(url, 'CLOUD_URL not set')
  const privateKey = Deno.env.get('CLOUD_MACHINE_KEY')
  assert(privateKey, 'CLOUD_MACHINE_KEY not set')

  const engine = await WebClientEngine.start(url)

  const backchat = await Backchat.upsert(engine, privateKey)
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
  return {
    backchat,
    engine,
    privateKey,
    [Symbol.asyncDispose]: () => Promise.resolve(engine.stop()),
  }
}
guts(cradleMaker)

// TODO make a test that spins up a real localhost server
