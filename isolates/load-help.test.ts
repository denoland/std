import { expect } from '@utils'
import { Engine } from '../engine.ts'
import { Shell } from '../api/web-client.ts'
import { Help } from '@/constants.ts'
import { Api } from '@/isolates/load-help.ts'
Deno.test('loadAll', async (t) => {
  const engine = await Engine.create()
  const system = await engine.initialize()
  const artifact = Shell.create(engine, system.pid)
  const { pid } = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
  const { loadAll, load } = await artifact.actions<Api>('load-help', pid)
  await t.step('loadAll', async () => {
    expect(loadAll).toBeInstanceOf(Function)
    const helps = await loadAll() as Help[]
    expect(helps.length).toBeGreaterThan(5)
  })
  await t.step('load', async () => {
    const help = await load({ help: 'help-fixture' })
    expect(help).toHaveProperty('runner', 'ai-prompt')
    expect(help).toHaveProperty('instructions')
  })
  await artifact.stop()
})
