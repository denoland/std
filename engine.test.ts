import { Backchat } from './api/client-backchat.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import { cradleMaker } from '@/cradle-maker.ts'

Deno.test('cradle', async (t) => {
  const { backchat, engine, privateKey } = await cradleMaker()
  await t.step('basic', async () => {
    const result = await backchat.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
    const clone = await backchat.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
  })
  await t.step('second backchat', async () => {
    const next = await Backchat.upsert(engine, privateKey)
    expect(next.pid).not.toEqual(backchat.pid)
    expect(next.threadId).not.toEqual(backchat.threadId)
  })
  await t.step('new thread', async () => {
    // start a new thread using backchat
  })
  await engine.stop()

  // test intercepting backchat text
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain
