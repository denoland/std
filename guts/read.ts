import { Debug, expect, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'read', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })
    const { pid } = await artifact.init({ repo })
    const { write } = await artifact.pierces('io-fixture', pid)

    await t.step('read', async () => {
      Debug.enable('*tests *cradle')
      write({ path: 'test', content: 'hello' })
      for await (const splice of artifact.read({ pid, path: 'test' })) {
        log('splice', splice)
      }
    })

    await artifact.stop()
  })
}
