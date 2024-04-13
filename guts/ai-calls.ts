import { log } from '@utils'
import { Artifact } from '../api/web-client.types.ts'
import { PID } from '@/constants.ts'

export default (name: string, cradleMaker: () => Promise<Artifact>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'ai', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await artifact.rm({ repo })

    const { pid } = await artifact.clone({ repo })
    const { create } = await artifact.actions('session', pid)

    await t.step('prompt', async () => {
      const session = await create() as PID
      const { engage } = await artifact.actions('engage-help', session)
      const result = await engage({
        help: 'goalie',
        text: 'Say a single word',
      })
      log('result', result)
    })
    log('stopping')
    await artifact.stop()
    log('stopped')
  })
}
