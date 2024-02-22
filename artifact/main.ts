// TODO on first boot, run some diagnostic tests and benchmarks
// should be able to commit these benchmarks back to gh to publish them

import Cradle from './cradle.ts'
import { log } from '@utils'
import { PID } from './constants.ts'

const artifact = await Cradle.create()

// start a hono api server that mimics the artifact api

Deno.serve(async (req) => {
  if (req.url.endsWith('/favicon.ico')) {
    return new Response('', { status: 404 })
  }
  log('start', req.url)
  const result = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
  log('clone:', result)

  const target: PID = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }
  const isolate = 'engage-help'
  const { engageInBand } = await artifact.pierces(isolate, target)
  const helpResult = await engageInBand({
    help: 'help-fixture',
    text: 'hello',
  })

  return new Response('chat response: ' + JSON.stringify(helpResult, null, 2))

  // await artifact.pull('dreamcatcher-tech/HAL')
  // log('pull done')
  // const pid: PID = {
  //   account: 'dreamcatcher-tech',
  //   repository: 'HAL',
  //   branches: ['main'],
  // }

  // const actions = await artifact.actions(isolate, pid)
  // log('actions done')
  // const result = await actions.local()
  // log('result', result)
  // const result2 = await actions.local()
  // log('result2', result2)
  // return new Response('Hello Artifact')
})
