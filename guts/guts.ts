// the Grand Unified Test Suite™

import { expect, log } from '@utils'
import processMgmt from './process-mgmt.ts'
import aiCalls from './ai-calls.ts'
import splices from './splices.ts'
import benchmarks from './benchmarks.ts'
import sessions from './guts-sessions.ts'
import hal from './guts-hal.ts'
import { CradleMaker } from '@/constants.ts'

const ioFixture = 'io-fixture'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '

  Deno.test(prefix + 'io', async (t) => {
    const session = await cradleMaker()
    log('start')
    log('session created')
    await t.step('ping empty', async () => {
      const empty = await session.ping()
      expect(empty).toEqual(undefined)
    })
    log('ping done')
    await t.step('ping with params', async () => {
      const result = await session.ping({ data: { test: 'test' } })
      expect(result).toEqual({ test: 'test' })
    })
    log('params done')
    await session.engineStop()
    log('stop done')
  })
  Deno.test(prefix + 'init', async () => {
    const session = await cradleMaker()
    log('session complete')
    const result = await session.init({ repo: 'test/init' })
    log('init result', result)
    expect(result).toBeDefined()
    expect(result!.pid).toBeDefined()
    expect(result!.pid.account).toBe('test')
    expect(result!.pid.repository).toBe('init')
    expect(typeof result!.head).toBe('string')
    await session.engineStop()
  })
  Deno.test(prefix + 'rm', async () => {
    const session = await cradleMaker()
    const first = await session.rm({ repo: 'dreamcatcher-tech/HAL' })
    expect(first).toBe(false)

    await session.init({ repo: 'dreamcatcher-tech/HAL' })
    const second = await session.rm({ repo: 'dreamcatcher-tech/HAL' })
    expect(second).toBe(true)

    await session.engineStop()
  })
  Deno.test(prefix + 'clone', async (t) => {
    const session = await cradleMaker()

    await t.step('clone', async () => {
      await session.rm({ repo: 'dreamcatcher-tech/HAL' })
      const clone = await session.clone({ repo: 'dreamcatcher-tech/HAL' })
      // TODO read the fs and see what the state of the file system is ?
      expect(clone.pid).toBeDefined()
      expect(clone.pid.account).toBe('dreamcatcher-tech')
      expect(clone.pid.repository).toBe('HAL')
      expect(typeof clone.head).toBe('string')
    })
    await session.engineStop()
  })
  Deno.test.ignore(prefix + 'child to self', async () => {})
  Deno.test.ignore(prefix + 'child to child', async () => {})
  Deno.test.ignore(prefix + 'child to parent', async () => {})
  Deno.test(prefix + 'pierce', async (t) => {
    const session = await cradleMaker()
    await session.rm({ repo: 'cradle/pierce' })
    const { pid: target } = await session.init({ repo: 'cradle/pierce' })
    const actions = await session.actions(ioFixture, target)
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
    await session.engineStop()
  })

  processMgmt(name, cradleMaker)
  sessions(name, cradleMaker)
  aiCalls(name, cradleMaker)
  splices(name, cradleMaker)
  hal(name, cradleMaker)
  benchmarks(name, cradleMaker)
}
