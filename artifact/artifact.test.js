import Artifact from './artifact.ts'
import { expect } from './tst-helpers.js'

Deno.test('artifact', async (t) => {
  const artifact = Artifact.create()
  await t.step('pull', async () => {
    await artifact.pull({ repo: 'dreamcatcher-tech/HAL' })
  })
  await t.step('isolateApi', async () => {
    const isolateApi = await artifact.isolateApi('io.fixture')
    expect(Object.keys(isolateApi)).toHaveLength(4)
  })
  await t.step('actions', async () => {
    const actions = await artifact.inBands('io.fixture')
    expect(Object.keys(actions)).toHaveLength(4)
    expect(Object.values(actions).every((fn) => typeof fn === 'function'))
      .toBeTruthy()
  })
})
