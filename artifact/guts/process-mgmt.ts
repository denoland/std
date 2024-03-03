import { Debug, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'branch', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/branch'
    const { pid } = await artifact.init({ repo })
    await t.step('branch', async () => {
      // start a new session
      const { create } = await artifact.pierces('session', pid)
      // TODO make an isolate that can take in the options as params
      Debug.enable('AI:*')
      const session = await create({}, { noClose: true })

      log('session', session)

      // do some random stuff using io-fixture
      // close the branch
    })
    await artifact.stop()
  })
}
