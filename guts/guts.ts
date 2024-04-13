// the Grand Unified Test Suite™

import { expect, log } from '@utils'
import { Artifact } from '../api/web-client.types.ts'
import processMgmt from './process-mgmt.ts'
import aiCalls from './ai-calls.ts'
import splices from './splices.ts'
import { pidFromRepo } from '@/constants.ts'

const ioFixture = 'io-fixture'

export default (name: string, cradleMaker: () => Promise<Artifact>) => {
  const prefix = name + ': '

  Deno.test(prefix + 'io', async (t) => {
    const artifact = await cradleMaker()
    await t.step('ping empty', async () => {
      const empty = await artifact.ping()
      expect(empty).toEqual(undefined)
    })
    await t.step('ping with params', async () => {
      const result = await artifact.ping({ data: { test: 'test' } })
      expect(result).toEqual({ test: 'test' })
    })
    await t.step('clone', async () => {
      log.enable('AI:qex*')
      await artifact.rm({ repo: 'dreamcatcher-tech/HAL' })
      const clone = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
      log('clone result', clone)
      // TODO read the fs and see what the state of the file system is ?
      expect(clone.pid).toBeDefined()
      expect(clone.pid.account).toBe('dreamcatcher-tech')
      expect(typeof clone.head).toBe('string')
    })
    await artifact.stop()
  })
  Deno.test.ignore(prefix + 'child to self', async () => {})
  Deno.test.ignore(prefix + 'child to child', async () => {})
  Deno.test.ignore(prefix + 'child to parent', async () => {})
  Deno.test(prefix + 'pierce', async (t) => {
    const artifact = await cradleMaker()
    await artifact.rm({ repo: 'cradle/pierce' })
    const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })
    const actions = await artifact.actions(ioFixture, target)
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
      const msg = 'Parameters Validation Error: '
      await expect(actions.local({ invalid: 'parameters' }))
        .rejects.toThrow(msg)
    })
    await artifact.stop()
  })

  Deno.test.ignore(prefix + 'resource hogging', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })
    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.actions(ioFixture, target)

    await t.step('serial', async () => {
      log.enable('AI:qex*')
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local())
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      // TODO get historical splices and confirm depth of actions

      await artifact.stop()
    })
  })
  Deno.test.ignore(prefix + 'resource hogging parallel', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })

    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.actions(ioFixture, target)

    await t.step('parallel', async () => {
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local({}, { branch: true }))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      await artifact.stop()
    })
  })
  Deno.test(prefix + 'github operations', async (t) => {
    const artifact = await cradleMaker()
    const pid = pidFromRepo(artifact.pid.id, 'dreamcatcher-tech/HAL')
    await artifact.rm({ repo: 'dreamcatcher-tech/HAL' })
    await t.step('probe empty', async () => {
      const result = await artifact.probe({ pid })
      log('probe result', result)
      expect(result).toBeUndefined()
    })
    await t.step('init', async () => {
      const result = await artifact.init({ repo: 'dreamcatcher-tech/HAL' })
      log('init result', result)
      expect(result).toBeDefined()
      expect(result!.pid).toEqual(pid)
      expect(typeof result!.head).toBe('string')
    })
    await t.step('probe', async () => {
      const result = await artifact.probe({ pid })
      log('probe result', result)
      expect(result).toBeDefined()
      expect(result!.pid).toEqual(pid)
    })
    await artifact.stop()
  })
  processMgmt(name, cradleMaker)
  aiCalls(name, cradleMaker)
  splices(name, cradleMaker)
}
