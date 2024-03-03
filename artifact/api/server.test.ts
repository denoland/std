import { Outcome } from '@/artifact/constants.ts'
import Server from './server.ts'
import { expect } from '@utils'
import WebClient from '@/artifact/api/web-client.ts'
import guts from '../guts/main.ts'
import { deserializeError } from 'https://esm.sh/serialize-error'

Deno.test('hono basic', async (t) => {
  await t.step('ping', async () => {
    const server = await Server.create()
    const payload = { ping: 'test', extra: 'line' }
    const res = await server.request('/api/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const reply: Outcome = await res.json()
    expect(reply.result).toEqual(payload)
    await server.stop()
  })
})

const cradleMaker = async () => {
  const server = await Server.create()
  const fetcher = server.request as typeof fetch

  const cradle = new WebClient('mock', deserializeError, fetcher)
  cradle.stop = () => server.stop()
  return cradle
}
guts('Web', cradleMaker)
