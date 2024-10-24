import { expect, log } from '@utils'
import { assert } from '@std/assert'
import { CradleMaker, IoStruct } from '@/constants.ts'
import 'benchmark' // load these modules into cache for ghactions
import { Api } from '@/isolates/io-fixture.ts'
import * as files from '@/isolates/files.ts'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'benchmarks: '

  Deno.test(prefix + 'resource hogging', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'benchmark/serial'
    const { pid: target } = await backchat.init({ repo })
    const { local } = await backchat.actions<Api>('io-fixture', { target })

    await t.step('serial', async () => {
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local({}))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      // TODO get historical splices and confirm depth of actions
    })
    await backchat.rm({ repo })
  })
  Deno.test(prefix + 'resource hogging parallel', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'benchmark/parallel'

    const { pid: target } = await backchat.init({ repo })
    const { local } = await backchat.actions<Api>('io-fixture', {
      target,
      branch: true,
    })
    await t.step('parallel', async () => {
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local({}))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')
    })
    await t.step('io.json is blank', async () => {
      const backchatIo = await backchat.readJSON<IoStruct>('.io.json')
      expect(Object.keys(backchatIo.requests)).toHaveLength(1)
      expect(Object.keys(backchatIo.executed)).toHaveLength(0)
      expect(Object.keys(backchatIo.replies)).toHaveLength(1)
      expect(Object.keys(backchatIo.pendings)).toHaveLength(0)
      expect(Object.keys(backchatIo.branches)).toHaveLength(0)

      const targetIo = await backchat.readJSON<IoStruct>('.io.json', target)

      expect(Object.keys(targetIo.executed)).toHaveLength(0)
      expect(Object.keys(targetIo.pendings)).toHaveLength(0)
      expect(Object.keys(targetIo.branches)).toHaveLength(0)
      // TODO verify there are no child branches of target remaining
    })
    await backchat.rm({ repo })
  })
  Deno.test.ignore(prefix + 'flare', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'benchmark/flare'
    await backchat.rm({ repo })
    const target = {
      repoId: '0',
      account: 't',
      repository: 'flare',
      branches: ['main'],
    }
    const { pid } = await backchat.init({ repo })
    expect(target).toEqual(pid)
    const { parallel, squared } = await backchat.actions<Api>('io-fixture', {
      target,
    })

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
  })
  Deno.test.ignore(prefix + 'records', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'benchmark/records'
    await backchat.rm({ repo })
    const { pid: target } = await backchat.init({ repo })
    const count = 100

    await t.step('touch', async () => {
      const { touch } = await backchat.actions<Api>('io-fixture', { target })
      const prefix = 'cust-'
      log('start')
      await touch({ count, prefix, suffix: '.txt' })
      log('stop after:', count)
    })
    await t.step('ls', async () => {
      const { ls } = await backchat.actions<files.Api>('files', { target })
      const result = await ls({ count: true, reasoning: [] })
      log('result', result)
      expect(result).toBe(count + 1)
    })
    await t.step('update 1', async () => {
      const path = `cust-${count - 1}.txt`
      const content = 'this is the new content'
      const { write } = await backchat.actions<files.Api>('files', {
        target,
      })
      await write({ reasoning: [], path, content })
      const result = await backchat.read(path, target)
      log('contents', result)
      expect(result).toEqual(content)
    })

    // then time how long it takes to write text to those files both at
    // creation, and also afterwards.
  })
}
