import { Outcome } from '@/artifact/constants.ts'
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
    const reply: Outcome = await res.json()
    expect(reply.result).toEqual(payload)
  })
  await server.stop()
})

// make a client class, wrap it, drop into the grand unified test suite
// then copy this client class over to the ui and use it there

// then drop using .request() directly, since the client can be used in place
