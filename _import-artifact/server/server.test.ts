import { type CradleMaker, Outcome } from '@/constants.ts'
import Server from './server.ts'
import { assert, delay, expect } from '@utils'
import { WebClientEngine } from '../api/client-engine.ts'
import guts from '../guts/guts.ts'
import { Backchat } from '../api/client-backchat.ts'
import { cradleMaker } from '@/cradle-maker.ts'
import { Engine } from '@/engine.ts'

const webCradleMaker: CradleMaker = async (t, url, update, init) => {
  const { engine: core, privateKey, backchat: { id: backchatId } } =
    await cradleMaker(t, url, update, init)
  assert(core instanceof Engine, 'not an engine')

  const server = Server.create(core)
  const fetcher = server.request as typeof fetch

  const engine = await WebClientEngine.start('https://mock', fetcher)
  const backchat = await Backchat.upsert(engine, privateKey, backchatId)

  // think the watcher is causing resource leaks
  await delay(10)

  const clientStop = engine.stop.bind(engine)
  engine.stop = async () => {
    // must stop the client first, else will retry
    clientStop()
    await server.stop()
    // oddly needs another loop to avoid resource leaks in fast tests
    await delay(10)
  }
  return {
    backchat,
    engine,
    privateKey,
    [Symbol.asyncDispose]: () => Promise.resolve(engine.stop()),
  }
}
Deno.test('hono basic', async (t) => {
  await t.step('ping', async () => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { engine } = cradle
    assert(engine instanceof Engine, 'not an engine')
    const server = Server.create(engine)
    const payload = { data: { ping: 'test', extra: 'line' } }
    const res = await server.request('/api/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const reply: Outcome = await res.json()
    expect(reply.result).toEqual(payload)
  })
})

guts(webCradleMaker)
