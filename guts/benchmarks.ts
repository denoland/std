import { expect, log } from '@utils'
import { assert } from '@std/assert'
import { CradleMaker, IoStruct } from '@/constants.ts'

const ioFixture = 'io-fixture'
export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '

  Deno.test(prefix + 'resource hogging', async (t) => {
    const session = await cradleMaker()
    const repo = 'benchmark/serial'
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
  Deno.test(prefix + 'resource hogging parallel', async (t) => {
    const session = await cradleMaker()
    const repo = 'benchmark/parallel'

    const { pid: target } = await session.init({ repo })
    const { local } = await session.actions(ioFixture, target)
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
    })
    await t.step('io.json is blank', async () => {
      const sessionIo = await session.readJSON<IoStruct>('.io.json')
      expect(Object.keys(sessionIo.requests)).toHaveLength(1)
      expect(Object.keys(sessionIo.executed)).toHaveLength(0)
      expect(Object.keys(sessionIo.replies)).toHaveLength(1)
      expect(Object.keys(sessionIo.pendings)).toHaveLength(0)
      expect(Object.keys(sessionIo.branches)).toHaveLength(0)

      const targetIo = await session.readJSON<IoStruct>('.io.json', target)

      expect(Object.keys(targetIo.executed)).toHaveLength(0)
      expect(Object.keys(targetIo.pendings)).toHaveLength(0)
      expect(Object.keys(targetIo.branches)).toHaveLength(0)
      // TODO verify there are no child branches of target remaining
    })
    await session.rm({ repo })
    await session.engineStop()
  })
  Deno.test.ignore(prefix + 'flare', async (t) => {
    const session = await cradleMaker()
    const repo = 'benchmark/flare'
    await session.rm({ repo })
    const target = {
      repoId: '0',
      account: 't',
      repository: 'flare',
      branches: ['main'],
    }
    const { pid } = await session.init({ repo })
    expect(target).toEqual(pid)
    const { parallel, squared } = await session.actions(ioFixture, target)

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
    await session.engineStop()
  })
  Deno.test.ignore(prefix + 'records', async (t) => {
    const session = await cradleMaker()
    const repo = 'benchmark/records'
    await session.rm({ repo })
    const { pid: target } = await session.init({ repo })
    const count = 100

    await t.step('touch', async () => {
      const { touch } = await session.actions(ioFixture, target)
      const prefix = 'cust-'
      log('start')
      await touch({ count, prefix, suffix: '.txt' })
      log('stop after:', count)
    })
    await t.step('ls', async () => {
      const { ls } = await session.actions('files', target)
      const result = await ls({ count: true })
      log('result', result)
      expect(result).toBe(count + 1)
    })
    await t.step('update 1', async () => {
      const path = `cust-${count - 1}.txt`
      const content = 'this is the new content'
      const { write, read } = await session.actions('files', target)
      await write({ path, content })
      const result = await read({ path })
      log('contents', result)
      expect(result).toEqual(content)
    })

    await session.engineStop()

    // then time how long it takes to write text to those files both at
    // creation, and also afterwards.
  })
}
