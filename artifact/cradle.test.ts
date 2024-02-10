import Cradle from './cradle.ts'
import { expect, log } from './tst-helpers.js'
import { JsonValue, PID } from './constants.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'
const isolate = 'io.fixture'

Deno.test.only('io', async (t) => {
  const artifact = await Cradle.create()
  await t.step('clone', async () => {
    await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
    // TODO read the fs and see what the state of the file system is ?
  })
  const pid: PID = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }

  const actions = await artifact.actions({ isolate, pid })
  await t.step('local', async () => {
    const result = await actions!.local()
    expect(result).toBe('local reply')
  })
  // await t.step('second local', async () => {
  //   const second = await actions.local({})
  //   expect(second).toBe('local reply')
  // })
  // await t.step('throws', async () => {
  //   const msg = 'Parameters Validation Error'
  //   await expect(() => actions.local('throwme')).rejects.toThrow(msg)
  // })
  // await t.step('child process', async () => {
  //   const result = await actions.spawn({ isolate })
  //   expect(result).toBe('remote pong')
  // })
  await artifact.stop()
})
Deno.test.ignore('child to self', async (t) => {})
Deno.test.ignore('child to child', async (t) => {})
Deno.test.ignore('child to parent', async (t) => {})
