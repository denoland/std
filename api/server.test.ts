import { Outcome } from '@/constants.ts'
import Server from './server.ts'
import { deserializeError, expect, toEvents } from '@utils'
import WebClient from '@/api/web-client.ts'
import guts from '../guts/guts.ts'
Deno.test('hono basic', async (t) => {
  await t.step('ping', async () => {
    const server = await Server.create()
    const payload = { data: { ping: 'test', extra: 'line' } }
    const res = await server.request('/api/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const reply: Outcome = await res.json()
    expect(reply.result).toEqual(payload.data)
    await server.stop()
  })
})

const cradleMaker = async () => {
  const server = await Server.create()
  const fetcher = server.request as typeof fetch

  const cradle = new WebClient('mock', deserializeError, toEvents, fetcher)
  const clientStop = cradle.stop.bind(cradle)
  cradle.stop = async () => {
    // must stop the client first, else will retry
    await clientStop()
    await server.stop()
  }
  return cradle
}
guts('Web', cradleMaker)
