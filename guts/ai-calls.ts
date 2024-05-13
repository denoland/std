import { log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { print } from '@/constants.ts'
import { Api } from '@/isolates/engage-help.ts'

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'ai', async (t) => {
    const session = await cradleMaker()
    log('pid', print(session.pid))

    await session.rm({ repo: 'dreamcatcher-tech/HAL' })
    const { pid } = await session.clone({ repo: 'dreamcatcher-tech/HAL' })

    await t.step('prompt', async () => {
      const { engage } = await session.actions<Api>('engage-help', pid)
      await engage({
        help: 'goalie',
        text: 'What can you do ?',
      })
    })
    log('stopping')
    await session.engineStop()
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
