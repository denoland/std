import cradle from './cradle.ts'
import { expect, log } from './tst-helpers.js'
import { JsonValue, PID } from './constants.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'

Deno.test.only('io', async (t) => {
  const artifact = await cradle()
  // await artifact.pull('dreamcatcher-tech/HAL')
  // const pid: PID = {
  //   account: 'dreamcatcher-tech',
  //   repository: 'HAL',
  //   branches: ['main'],
  // }

  // let result
  // const actions = await artifact.actions(isolate, pid)
  // await t.step('local', async () => {
  //   result = await actions.local()
  //   expect(result).toBe('local reply')
  // })
  // await t.step('second local', async () => {
  //   const second = await actions.local({})
  //   expect(second).toBe('local reply')
  // })
  const result = await artifact.ping()
  log('ping:', result)
  artifact.stop()
})
