import { Engine } from './engine.ts'
import { Shell } from './shell.ts'
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
    const system = await engine.initialize()
    log('system', system)
    const shell = Shell.create(engine, system.pid)

    const result = await shell.ping({ data: 'hello' })
    expect(result).toBe('hello')

    log.enable('AI:* -*KV')
    await shell.rm({ repo: 'test/test' })

    await shell.stop()
  })
})

guts('Queue', cradleMaker)

// confirm cannot delete the system chain ?
