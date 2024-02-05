import Artifact from '../artifact.ts'
import { expect, log } from '../tst-helpers.js'
const isolate = 'io.fixture'
import { JsonValue, ProcessAddress } from '../constants.ts'

Deno.test.only('io', async (t) => {
  const artifact = await Artifact.create()
  await artifact.pull('dreamcatcher-tech/HAL')
  const pid: ProcessAddress = {
    account: 'dreamcatcher-tech',
    repository: 'HAL',
    branches: ['main'],
  }
  const actions = await artifact.actions(isolate, pid)

  // should be able to make a new blank repo, just for testing ?

  let result: JsonValue
  result = await actions.local()
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
})
Deno.test.ignore('child to self', async (t) => {})
Deno.test.ignore('child to child', async (t) => {})
Deno.test.ignore('child to parent', async (t) => {})
