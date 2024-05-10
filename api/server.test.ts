import { Outcome } from '@/constants.ts'
import Server from './server.ts'
import { expect } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import { Machine } from '@/api/web-client-machine.ts'
Deno.test('hono basic', async (t) => {
  await t.step('ping', async () => {
    const server = await Server.create()
    const payload = { data: { ping: 'test', extra: 'line' } }
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
  await WebClientEngine.provision('mock', fetcher)

  const engine = await WebClientEngine.start('mock', fetcher)
  const machine = Machine.load(engine)
  const session = machine.openSession()
  const clientStop = session.engineStop.bind(session)
  session.engineStop = async () => {
    // must stop the client first, else will retry
    await clientStop()
    await server.stop()
  }
  return session
}
guts('Web', cradleMaker)
