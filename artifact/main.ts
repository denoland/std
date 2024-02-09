// TODO on first boot, run some diagnostic tests and benchmarks
// should be able to commit these benchmarks back to gh to publish them

import cradle from './cradle.ts'
import { expect, log } from './tst-helpers.js'
import { JsonValue, PID } from './constants.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'

const artifact = await cradle()

// start a hono api server that mimicks the artifact api

Deno.serve(async (req) => {
  if (req.url.endsWith('/favicon.ico')) {
    return new Response('', { status: 404 })
  }
  log('start', req.url)
  const result = await artifact.ping()
  log('ping:', result)
  return new Response('ping: ' + result)

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
