import { assert, expect, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'files', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    await t.step('read', async () => {
      write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of artifact.read(pid, 'test')) {
        log('splice', splice)
        if (splice.changes) {
          first = splice
          break
        }
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(first.path).toEqual('test')
      expect(first.changes).toHaveLength(1)
      assert(first.changes)
      expect(first.changes[0].value).toEqual('hello')
    })
    // do a writeSlow test to see how broadcast channel behaves
    // and to test the catchup of the final commit

    await artifact.stop()
  })
  Deno.test(prefix + '.io.json diffs', async (t) => {
    // send in a bunch of actions and view the diffs as splices

    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    const logger = async () => {
      const stream = artifact.read(pid, '.io.json')
      // make a library that transforms splice streams
      for await (const splice of stream) {
        log('splice', splice.path)
      }
      log('done')
    }
    logger()

    await t.step('read', async () => {
      write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of artifact.read(pid, 'test')) {
        if (splice.changes) {
          first = splice
          break
        }
      }
      assert(first)
      expect(first.pid).toEqual(pid)
      expect(first.path).toEqual('test')
      expect(first.changes).toHaveLength(1)
      assert(first.changes)
      expect(first.changes[0].value).toEqual('hello')
    })
    await artifact.stop()
  })
  Deno.test(prefix + 'file changes', async (t) => {
    const repo = 'test/files'
    const artifact = await cradleMaker()
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })

    let fileSpliceCount = 0
    const fileSplices = async () => {
      for await (const splice of artifact.read(pid, 'test.txt')) {
        log('file', splice.path)
        fileSpliceCount++
      }
    }
    fileSplices()
    let spliceCount = 0
    const splices = async () => {
      for await (const splice of artifact.read(pid)) {
        log('splice', splice.oid)
        spliceCount++
      }
    }
    splices()

    await t.step('write', async () => {
      const { write } = await artifact.pierces('io-fixture', pid)
      await write({ path: 'test.txt', content: 'hello' })
      write({ path: 'test.txt', content: 'ell' })
      let fileCount = 0
      for await (const _splice of artifact.read(pid, 'test.txt')) {
        fileCount++
        if (fileCount === 3) {
          break
        }
      }
    })
    log('spliceCount', spliceCount)
    log('fileSpliceCount', fileSpliceCount)
    await artifact.stop()
  })

  // do broadcast channel for partial writes occurring
}
