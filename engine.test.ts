import { Engine } from './engine.ts'
import { Shell } from '@/api/web-client.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'

const cradleMaker = async () => {
  const engine = await Engine.create()
  const system = await engine.initialize()
  const shell = Shell.create(engine, system.pid)
  return shell
}

Deno.test.only('cradle', async (t) => {
  await t.step('basic', async () => {
    const engine = await Engine.create()
    log.enable('AI:qex*')
    const system = await engine.initialize()
    log('system', system)
    const shell = Shell.create(engine, system.pid)

    const result = await shell.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await shell.rm({ repo: 'test/test' })
    const clone = await shell.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    // TODO read the fs and see what the state of the file system is ?
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
    expect(clone.elapsed).toBeGreaterThan(100)
    await shell.stop()
  })
})

guts('Queue', cradleMaker)

// confirm cannot delete the system chain ?
