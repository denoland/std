import { expect } from '@utils'
import Cradle from '../engine.ts'
import { Help } from '@/constants.ts'
Deno.test('loadAll', async (t) => {
  const artifact = await Cradle.create()
  const { pid } = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
  const { loadAll, load } = await artifact.pierces('load-help', pid)
  await t.step('loadAll', async () => {
    expect(loadAll).toBeInstanceOf(Function)
    const helps = await loadAll() as Help[]
    expect(helps.length).toBeGreaterThan(5)
  })
  await t.step('load', async () => {
    const help = await load({ help: 'help-fixture' })
    expect(help).toHaveProperty('runner', 'runner-chat')
    expect(help).toHaveProperty('instructions')
  })
  await artifact.stop()
})
