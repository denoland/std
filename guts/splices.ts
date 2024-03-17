import { assert, expect, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'files', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    await t.step('read', async () => {
      write({ path: 'test', content: 'hello' })
      let first
      for await (const splice of artifact.read({ pid, path: 'test' })) {
        log('splice', splice)
        first = splice
        break
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
}
