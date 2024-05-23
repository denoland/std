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
  const machineKey = Deno.env.get('CLOUD_MACHINE_KEY')
  assert(machineKey, 'CLOUD_MACHINE_KEY not set')

  const engine = await WebClientEngine.start(url)
  const machine = Machine.load(engine, machineKey)

  const terminal = machine.openTerminal()
  if (!introDone) {
    introDone = true
    console.log('testing:', url)
    const repos = await terminal.lsRepos()
    if (repos.length) {
      console.log('deleting repos:', repos)
      await terminal.rm({ all: true })

      const postRepos = await terminal.lsRepos()
      console.log('postRepos:', postRepos)
    }
  }
  return terminal
}
guts('Cloud', cradleMaker)

// TODO make a test that spins up a real localhost server
