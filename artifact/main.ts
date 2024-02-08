// TODO on first boot, run some diagnostic tests and benchmarks
// should be able to commit these benchmarks back to gh to publish them
import { log } from './tst-helpers.js'
const isolate = 'io.fixture'
import { PID } from './constants.ts'
import Artifact from './artifact2.ts'

const artifact = await Artifact.create()

// start a hono api server that mimicks the artifact api

Deno.serve(async (req) => {
  if (req.url.endsWith('/favicon.ico')) {
    return new Response('', { status: 404 })
  }
  log('start', req.url)

  await artifact.pull('dreamcatcher-tech/HAL')
  log('pull done')
  const pid: PID = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }

  const actions = await artifact.actions(isolate, pid)
  log('actions done')
  const result = await actions.local()
  log('result', result)
  const result2 = await actions.local()
  log('result2', result2)
  return new Response('Hello Artifact')
})
