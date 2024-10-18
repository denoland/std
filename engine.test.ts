import { Backchat } from './api/client-backchat.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import { cradleMaker } from '@/cradle-maker.ts'
import * as backchat from './isolates/backchat.ts'
import { getBaseName } from '@/constants.ts'

Deno.test('cradle', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { engine, privateKey, backchat } = cradle
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
    const firstBase = await backchat.threadPID()
    const secondBase = await next.threadPID()
    expect(firstBase).not.toEqual(secondBase)

    const { newThread } = await next.actions<backchat.Api>('backchat')
    const threadId = await newThread({})
    const thirdBase = await next.threadPID()
    expect(getBaseName(thirdBase)).toEqual(threadId)
    expect(secondBase).not.toEqual(thirdBase)
  })

  // test intercepting backchat text
})

guts(cradleMaker)

// TODO confirm cannot delete the system chain
