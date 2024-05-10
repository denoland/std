import { Engine } from './engine.ts'
import { Machine } from './api/web-client-machine.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'

const cradleMaker = async () => {
  const engine = await Engine.start()
  await engine.provision()
  const machine = Machine.load(engine)
  const session = machine.openSession()
  return session
}

Deno.test('cradle', async (t) => {
  await t.step('basic', async () => {
    const base = await cradleMaker()

    const result = await base.ping({ data: 'hello' })
    expect(result).toBe('hello')

    const clone = await base.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
    await base.engineStop()
  })
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain ?
