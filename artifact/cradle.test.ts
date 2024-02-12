import Cradle from './cradle.ts'
import { expect, log } from './tst-helpers.js'
import { JsonValue, PID } from './constants.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'
const isolate = 'io-fixture'

Deno.test.only('io', async (t) => {
  const artifact = await Cradle.create()
  await t.step('clone', async () => {
    const cloneResult = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', cloneResult)
    // TODO read the fs and see what the state of the file system is ?
  })

  const pid: PID = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }
  const dispatches = await artifact.dispatches({ isolate, pid })
  await t.step('local', async () => {
    const result = await dispatches.local()
    log('local result', result)
    expect(result).toBe('local reply')
  })
  await t.step('second local', async () => {
    const second = await dispatches.local()
    expect(second).toBe('local reply')
  })
  await t.step('throws', async () => {
    const message = 'test message'
    await expect(dispatches.error({ message })).rejects.toThrow(message)
  })
  // await t.step('child process', async () => {
  //   const result = await actions.spawn({ isolate })
  //   expect(result).toBe('remote pong')
  // })
  await artifact.stop()
})
Deno.test.ignore('child to self', async (t) => {})
Deno.test.ignore('child to child', async (t) => {})
Deno.test.ignore('child to parent', async (t) => {})
