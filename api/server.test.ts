import { Outcome, Provisioner } from '@/constants.ts'
import Server from './server.ts'
import { expect } from '@utils'
import { WebClientEngine } from '@/api/web-client-engine.ts'
import guts from '../guts/guts.ts'
import DB from '@/db.ts'
import { Crypto } from '@/api/web-client-crypto.ts'
import { Backchat } from '@/api/web-client-backchat.ts'

const superuserPrivateKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
Deno.test('hono basic', async (t) => {
  await t.step('ping', async () => {
    const server = await Server.create(superuserPrivateKey, aesKey)
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

const cradleMaker = async (init?: Provisioner) => {
  const server = await Server.create(superuserPrivateKey, aesKey, init)
  const fetcher = server.request as typeof fetch

  const engine = await WebClientEngine.start('mock', fetcher)
  const backchat = await Backchat.upsert(engine, Crypto.generatePrivateKey())
  const clientStop = engine.stop.bind(engine)
  engine.stop = async () => {
    // must stop the client first, else will retry
    clientStop()
    await server.stop()
  }
  return { backchat, engine }
}
guts('Web', cradleMaker)
