import Server from './server.ts'
import { expect } from '@utils'
Deno.test('api', async (t) => {
  const server = await Server.create()
  await t.step('ping empty', async () => {
    const payload = { ping: 'test', extra: 'line' }
    const res = await server.request('/api/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const reply = await res.json()
    expect(reply).toEqual(payload)
  })
  await server.stop()
})

// make a client class, wrap it, drop into the grand unified test suite
// then copy this client class over to the ui and use it there
