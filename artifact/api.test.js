import API from './api.js'

Deno.test('api', async (t) => {
  const api = await API.create()
  await t.step('reload', async () => {
    await api.reload({ repo: 'dreamcatcher-tech/HAL' })
  })
})
