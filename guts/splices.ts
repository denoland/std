import { assert, expect, log } from '@utils'
import { CradleMaker } from '@/constants.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'files', async (t) => {
    const session = await cradleMaker()
    const repo = 'splices/files'
    const { pid } = await session.init({ repo })
    const { write } = await session.actions('io-fixture', pid)

    await t.step('read', async () => {
      const p = write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of session.read(pid, 'test')) {
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
    // do a writeSlow test to see how broadcast channel behaves
    // and to test the catchup of the final commit

    await session.rm({ repo })
    await session.engineStop()
  })
  Deno.test(prefix + '.io.json diffs', async (t) => {
    // send in a bunch of actions and view the diffs as splices

    const session = await cradleMaker()
    const repo = 'splices/diffs'
    await session.rm({ repo })
    const { pid } = await session.init({ repo })
    const { write } = await session.actions('io-fixture', pid)

    const logger = async () => {
      const stream = session.read(pid, '.io.json')
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
      for await (const splice of session.read(pid, 'test')) {
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
    await session.engineStop()
  })
  Deno.test(prefix + 'file changes', async (t) => {
    const session = await cradleMaker()
    const repo = 'splices/changes'
    const { pid } = await session.init({ repo })

    let fileSpliceCount = 0
    const fileSplices = async () => {
      for await (const splice of session.read(pid, 'test.txt')) {
        log('file', splice.changes)
        fileSpliceCount++
      }
    }
    fileSplices()
    let spliceCount = 0
    const splices = async () => {
      for await (const splice of session.read(pid)) {
        log('splice', splice.oid)
        spliceCount++
      }
    }
    splices()

    await t.step('write', async () => {
      const { write } = await session.actions('io-fixture', pid)
      await write({ path: 'test.txt', content: 'hello' })
      const p = write({ path: 'test.txt', content: 'ell' })
      let fileCount = 0
      for await (const _splice of session.read(pid, 'test.txt')) {
        fileCount++
        if (fileCount === 3) {
          break
        }
      }
      await p
    })
    log('spliceCount', spliceCount)
    log('fileSpliceCount', fileSpliceCount)
    await session.engineStop()
  })

  // do broadcast channel for partial writes occurring
}
