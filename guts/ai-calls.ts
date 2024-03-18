import { Debug, log } from '@utils'
import { Cradle } from '../api/web-client.types.ts'
import { PID } from '@/constants.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await artifact.rm({ repo })

    const { pid } = await artifact.clone({ repo })
    const { create } = await artifact.pierces('session', pid)
    const session = await create() as PID

    const logger = async () => {
      const stream = artifact.read({ pid: session, path: '.io.json' })
      // make a library that transforms splice streams
      for await (const splice of stream) {
        log('splice')
      }
      log('done')
    }
    logger()
    await t.step('prompt', async () => {
      Debug.enable('*session *tests *cradle')
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
