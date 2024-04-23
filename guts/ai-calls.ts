import { log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { print } from '@/constants.ts'
import { Api } from '@/isolates/engage-help.ts'

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'ai', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await artifact.rm({ repo })

    log('pid', print(artifact.pid))

    const { pid } = await artifact.clone({ repo })

    await t.step('prompt', async () => {
      const { engage } = await artifact.actions<Api>('engage-help', pid)
      const result = await engage({
        help: 'goalie',
        text: 'What can you do ?',
      })
      log('result', result)
    })
    log('stopping')
    await artifact.stop()
    log('stopped')
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
