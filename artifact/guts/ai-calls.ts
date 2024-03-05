import { Debug } from '@utils'
import { Cradle } from '../api/web-client.types.ts'
import { PID } from '@/artifact/constants.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    const { pid } = await artifact.clone({ repo })
    const { create } = await artifact.pierces('session', pid)
    const session = await create({}, { noClose: true }) as PID
    await t.step('prompt', async () => {
      const { engageInBand } = await artifact.pierces('engage-help', session)
      Debug.enable('AI:*')
      const result = await engageInBand({
        help: 'goalie',
        text: 'Say a single word',
      })
      console.log('result', result)
    })
    await artifact.stop()
  })
}
