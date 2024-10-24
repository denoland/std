import { assert, expect, log } from '@utils'
import { CradleMaker } from '@/constants.ts'
import { Api } from '@/isolates/io-fixture.ts'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'splices: '
  Deno.test(prefix + 'files', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'splices/files'
    const { pid } = await backchat.init({ repo })
    const { write } = await backchat.actions<Api>('io-fixture', { target: pid })

    await t.step('read', async () => {
      const p = write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of backchat.watch(pid, 'test')) {
        log('splice', splice)
        if (splice.changes['test']) {
          first = splice
          break
        }
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(first.changes.test.patch).toEqual('hello')
      expect(Object.keys(first.changes)).toHaveLength(1)
      await p
    })
  })
  Deno.test(prefix + '.io.json diffs', async (t) => {
    // send in a bunch of actions and view the diffs as splices

    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'splices/diffs'
    await backchat.rm({ repo })
    const { pid } = await backchat.init({ repo })
    const { write } = await backchat.actions<Api>('io-fixture', { target: pid })

    const logger = async () => {
      const stream = backchat.watch(pid, '.io.json')
      // make a library that transforms splice streams
      for await (const splice of stream) {
        log('splice', splice.changes)
      }
      log('done')
    }
    logger()

    await t.step('read', async () => {
      const p = write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of backchat.watch(pid, 'test')) {
        if (splice.changes['test']) {
          first = splice
          break
        }
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(Object.keys(first.changes)).toHaveLength(1)
      await p
    })
  })
  Deno.test(prefix + 'file changes', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'splices/changes'
    const { pid } = await backchat.init({ repo })

    let fileSpliceCount = 0
    const fileSplices = async () => {
      for await (const splice of backchat.watch(pid, 'test.txt')) {
        log('file', splice.changes)
        fileSpliceCount++
      }
    }
    fileSplices()
    let spliceCount = 0
    const splices = async () => {
      for await (const splice of backchat.watch(pid)) {
        log('splice', splice.oid)
        spliceCount++
      }
    }
    splices()

    await t.step('write', async () => {
      const opts = { target: pid }
      const { write } = await backchat.actions<Api>('io-fixture', opts)
      await write({ path: 'test.txt', content: 'hello' })
      const p = write({ path: 'test.txt', content: 'ell' })
      let fileCount = 0
      for await (const _splice of backchat.watch(pid, 'test.txt')) {
        fileCount++
        if (fileCount === 3) {
          break
        }
      }
      await p
    })
    log('spliceCount', spliceCount)
    log('fileSpliceCount', fileSpliceCount)
  })

  // do broadcast channel for partial writes occurring
}
