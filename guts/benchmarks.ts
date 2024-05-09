import { expect, log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { assert } from '@std/assert'

const ioFixture = 'io-fixture'
export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '

  Deno.test(prefix + 'resource hogging', async (t) => {
    const session = await cradleMaker()
    const repo = 'cradle/pierce'
    const { pid: target } = await session.init({ repo })
    const { local } = await session.actions(ioFixture, target)

    await t.step('serial', async () => {
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

      await session.rm({ repo })
      await session.engineStop()
    })
  })
  Deno.test.only(prefix + 'resource hogging parallel', async (t) => {
    const session = await cradleMaker()
    const repo = 'cradle/pierce'

    const { pid: target } = await session.init({ repo })
    const { local } = await session.actions(ioFixture, target)
    await t.step('parallel', async () => {
      const promises = []
      const count = 100
      for (let i = 0; i < count; i++) {
        promises.push(local({}, { branch: true }))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')
    })
    await session.rm({ repo })
    await session.engineStop()
  })
  Deno.test.ignore(prefix + 'flare', async (t) => {
    const artifact = await cradleMaker()
    const repo = 't/flare'
    await artifact.rm({ repo })
    const target = {
      repoId: '0',
      account: 't',
      repository: 'flare',
      branches: ['main'],
    }
    const { pid } = await artifact.init({ repo })
    expect(target).toEqual(pid)
    const { parallel, squared } = await artifact.actions(ioFixture, target)

    await t.step('flare', async () => {
      const count = 50

      const results = await parallel({ count })
      expect(results).toHaveLength(count)
      assert(Array.isArray(results))
      for (const result of results) {
        expect(result).toBe('local reply')
      }
    })
    await t.step('flare squared', async () => {
      const count = 50
      const multiplier = 50

      const results = await squared({ count, multiplier })
      expect(results).toHaveLength(multiplier)
      assert(Array.isArray(results))
      for (const result of results) {
        expect(result).toHaveLength(count)
        assert(Array.isArray(result))
        for (const subresult of result) {
          expect(subresult).toBe('local reply')
        }
      }
    })
    await artifact.stop()
  })
  Deno.test.ignore(prefix + 'records', async (t) => {
    const artifact = await cradleMaker()
    const repo = 't/touch'
    await artifact.rm({ repo })
    const { pid: target } = await artifact.init({ repo })
    const count = 100

    await t.step('touch', async () => {
      const { touch } = await artifact.actions(ioFixture, target)
      const prefix = 'cust-'
      log('start')
      await touch({ count, prefix, suffix: '.txt' })
      log('stop after:', count)
    })
    await t.step('ls', async () => {
      const { ls } = await artifact.actions('files', target)
      const result = await ls({ count: true })
      log('result', result)
      expect(result).toBe(count + 1)
    })
    await t.step('update 1', async () => {
      const path = `cust-${count - 1}.txt`
      const content = 'this is the new content'
      const { write, read } = await artifact.actions('files', target)
      await write({ path, content })
      const result = await read({ path })
      log('contents', result)
      expect(result).toEqual(content)
    })

    await artifact.stop()

    // then time how long it takes to write text to those files both at
    // creation, and also afterwards.
  })
}
