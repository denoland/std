import { log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { print } from '@/constants.ts'
import { Api } from '@/isolates/engage-help.ts'

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'ai', async (t) => {
    const session = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await session.rm({ repo })

    log('pid', print(session.pid))

    const { pid } = await session.clone({ repo })

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
