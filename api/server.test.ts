import { Outcome } from '@/constants.ts'
import Server from './server.ts'
import { expect } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import { Home } from '@/api/web-client-home.ts'
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
  const { pid } = await server.engine.boot()

  const fetcher = server.request as typeof fetch

  const engine = WebClientEngine.create('mock', fetcher)
  const home = Home.create(engine, pid)
  const artifact = await home.createSession()
  const clientStop = artifact.stop.bind(artifact)
  artifact.stop = async () => {
    // must stop the client first, else will retry
    await clientStop()
    await server.stop()
  }
  return artifact
}
guts('Web', cradleMaker)
