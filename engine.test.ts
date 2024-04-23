import { Engine } from './engine.ts'
import { Home } from './api/web-client-home.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'

const cradleMaker = async () => {
  const engine = await Engine.create()
  const { pid } = await engine.initialize()
  const home = Home.create(engine, pid)
  const session = await home.createSession()
  return session
}

Deno.test('cradle', async (t) => {
  await t.step('basic', async () => {
    const session = await cradleMaker()

    const result = await session.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await session.rm({ repo: 'test/test' })
    const clone = await session.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
    expect(clone.elapsed).toBeGreaterThan(100)
    await session.stop()
  })
})

guts('Queue', cradleMaker)

// confirm cannot delete the system chain ?
