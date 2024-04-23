import { Outcome } from '@/constants.ts'
import Server from './server.ts'
import { expect } from '@utils'
import { Session } from './web-client-session.ts'
import { WebClientEngine } from '@/api/web-client-engine.ts'
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
  await server.engine.initialize()

  const fetcher = server.request as typeof fetch
  const system = server.engine.pid

  const engine = WebClientEngine.create('mock', fetcher)
  const shell = Session.create(engine, system)
  const clientStop = shell.stop.bind(shell)
  shell.stop = async () => {
    // must stop the client first, else will retry
    await clientStop()
    await server.stop()
  }
  return shell
}
guts('Web', cradleMaker)
