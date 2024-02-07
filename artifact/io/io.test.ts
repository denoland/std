import Artifact from '../artifact.ts'
import { expect, log } from '../tst-helpers.js'
const isolate = 'io.fixture'
import { JsonValue, PID } from '../constants.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'

Deno.test.only('io', async (t) => {
  const artifact = await Artifact.create()
  await artifact.pull('dreamcatcher-tech/HAL')
  const pid: PID = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }
  const actions = await artifact.actions(isolate, pid)

  // should be able to make a new blank repo, just for testing ?

  let result
  result = await actions.local()
  log('result:', result)
  expect(result).toBe('local reply')
  // await t.step('local', async () => {
  //   result = await actions.local()
  //   expect(result).toBe('local reply')
  // })
  // await t.step('second local', async () => {
  //   const second = await actions.local({})
  //   expect(second).toBe(result)
  // })
  // await t.step('throws', async () => {
  //   const msg = 'Parameters Validation Error'
  //   await expect(() => actions.local('throwme')).rejects.toThrow(msg)
  // })
  // await t.step('child process', async () => {
  //   const result = await actions.spawn({ isolate })
  //   expect(result).toBe('remote pong')
  // })
  artifact.stop()
})
Deno.test.ignore('child to self', async (t) => {})
Deno.test.ignore('child to child', async (t) => {})
Deno.test.ignore('child to parent', async (t) => {})
