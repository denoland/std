import { Backchat } from './api/client-backchat.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import { cradleMaker } from '@/cradle-maker.ts'
import * as backchat from './isolates/backchat.ts'
import { getBaseName } from '@/constants.ts'

Deno.test.only('cradle', async (t) => {
  const { backchat, engine, privateKey } = await cradleMaker()
  await t.step('basic', async () => {
    const result = await backchat.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
    log('backchat', backchat.pid)
    const clone = await backchat.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
  })
  let next: Backchat
  await t.step('second backchat', async () => {
    next = await Backchat.upsert(engine, privateKey)
    expect(next.pid).not.toEqual(backchat.pid)
    expect(next.id).not.toEqual(backchat.id)
  })
  await t.step('new thread', async () => {
    const firstBase = await backchat.readBaseThread()
    const secondBase = await next.readBaseThread()
    expect(firstBase).not.toEqual(secondBase)

    const { create } = await next.actions<backchat.Api>('backchat')
    const threadId = await create({})
    const thirdBase = await next.readBaseThread()
    expect(getBaseName(thirdBase)).toEqual(threadId)
    expect(secondBase).not.toEqual(thirdBase)
  })
  await engine.stop()

  // test intercepting backchat text
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain
