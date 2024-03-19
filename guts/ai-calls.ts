import { log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'
import { PID } from '@/constants.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await artifact.rm({ repo })

    const { pid } = await artifact.clone({ repo })
    const { create } = await artifact.pierces('session', pid)
    const session = await create() as PID

    await t.step('prompt', async () => {
      const { engage } = await artifact.pierces('engage-help', session)
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
