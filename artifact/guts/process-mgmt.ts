import { expect } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    const { pid } = await artifact.init({ repo })
    await t.step('create', async () => {
      // start a new session
      const { create } = await artifact.pierces('session', pid)
      const session = await create({}, { noClose: true })
      expect(session).toBeUndefined()

      // do some random stuff using io-fixture
      // close the branch
    })
    await artifact.stop()
  })
}
