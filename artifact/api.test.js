import API from './api.js'
import { expect } from './tst-helpers.js'

Deno.test('api', async (t) => {
  const api = API.create()
  await t.step('pull', async () => {
    await api.pull({ repo: 'dreamcatcher-tech/HAL' })
  })
  await t.step('isolateApi', async () => {
    const isolateApi = await api.isolateApi('io.fixture')
    expect(Object.keys(isolateApi)).toHaveLength(4)
  })
  await t.step('actions', async () => {
    const actions = await api.inBand('io.fixture')
    expect(Object.keys(actions)).toHaveLength(4)
    expect(Object.values(actions).every((fn) => typeof fn === 'function'))
      .toBeTruthy()
  })
})
