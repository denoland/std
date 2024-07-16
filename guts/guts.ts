// the Grand Unified Test Suite™

import { expect, log } from '@utils'
import processMgmt from './process-mgmt.ts'
import aiCalls from './ai-calls.ts'
// import splices from './splices.ts'
// import benchmarks from './benchmarks.ts'
import backchats from './guts-backchats.ts'
// import isolates from './guts-ai-isolates.ts'
// import hal from './guts-hal.ts'
import { CradleMaker } from '@/constants.ts'
import { assert } from '@std/assert'

const ioFixture = 'io-fixture'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '

  Deno.test(prefix + 'io', async (t) => {
    const { backchat, engine } = await cradleMaker()
    log('start')
    log('session created')
    await t.step('ping empty', async () => {
      const empty = await backchat.ping()
      expect(empty).toEqual(undefined)
    })
    log('ping done')
    await t.step('ping with params', async () => {
      const result = await backchat.ping({ data: { test: 'test' } })
      expect(result).toEqual({ test: 'test' })
    })
    log('params done')
    await engine.stop()
    log('stop done')
  })
  Deno.test(prefix + 'init', async () => {
    const { backchat, engine } = await cradleMaker()
    log('session complete')
    const result = await backchat.init({ repo: 'test/init' })
    log('init result', result)
    assert(result)
    expect(result.pid).toBeDefined()
    expect(result.pid.account).toBe('test')
    expect(result.pid.repository).toBe('init')
    expect(typeof result.head).toBe('string')
    await engine.stop()
  })
  Deno.test(prefix + 'rm', async () => {
    const { backchat, engine } = await cradleMaker()
    const first = await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
    expect(first).toBeFalsy()

    await backchat.init({ repo: 'dreamcatcher-tech/HAL' })
    const second = await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
    expect(second).toBeTruthy()

    await engine.stop()
  })
  Deno.test(prefix + 'clone', async (t) => {
    const { backchat, engine } = await cradleMaker()

    await t.step('clone', async () => {
      await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
      const clone = await backchat.clone({ repo: 'dreamcatcher-tech/HAL' })
      // TODO read the fs and see what the state of the file system is ?
      expect(clone.pid).toBeDefined()
      expect(clone.pid.account).toBe('dreamcatcher-tech')
      expect(clone.pid.repository).toBe('HAL')
      expect(typeof clone.head).toBe('string')
    })
    await engine.stop()
  })
  Deno.test.ignore(prefix + 'child to self', async () => {})
  Deno.test.ignore(prefix + 'child to child', async () => {})
  Deno.test.ignore(prefix + 'child to parent', async () => {})
  Deno.test(prefix + 'pierce', async (t) => {
    const { backchat, engine } = await cradleMaker()
    await backchat.rm({ repo: 'cradle/pierce' })
    const { pid: target } = await backchat.init({ repo: 'cradle/pierce' })
    const actions = await backchat.actions(ioFixture, { target })
    await t.step('local', async () => {
      const result = await actions.local()
      log('local result', result)
      expect(result).toBe('local reply')
    })
    await t.step('second local', async () => {
      const second = await actions.local()
      expect(second).toBe('local reply')
    })

    await t.step('throws', async () => {
      const message = 'test message'
      await expect(actions.error({ message })).rejects.toThrow(message)
    })
    await t.step('params fails validation', async () => {
      const msg = 'Parameters Validation Error '
      await expect(actions.local({ invalid: 'parameters' }))
        .rejects.toThrow(msg)
    })
    await engine.stop()
  })

  processMgmt(name, cradleMaker)
  backchats(name, cradleMaker)
  aiCalls(name, cradleMaker)
  // splices(name, cradleMaker)
  // hal(name, cradleMaker)
  // isolates(name, cradleMaker)
  // benchmarks(name, cradleMaker)
}
