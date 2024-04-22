import { log } from '@utils'
import { Artifact } from '../api/web-client.types.ts'
import { print } from '@/constants.ts'
import { Api as SApi } from '@/isolates/session.ts'
import { Api as EApi } from '@/isolates/engage-help.ts'

export default (name: string, cradleMaker: () => Promise<Artifact>) => {
  const prefix = name + ': '
  Deno.test.only(prefix + 'ai', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    await artifact.rm({ repo })

    log.enable('AI:tests AI:completions* AI:q*')
    log('pid', print(artifact.pid))

    const { pid } = await artifact.clone({ repo })
    // create session should be baked into the artifact api directly
    // the root chain would refuse to do anything, but the session chain lets
    // you do things.

    // it should return back a session instance of artifact, which can be used
    // as the jumpsite for the rest of the systemf

    // the shell should have very limited functions until the point it is a
    // session

    // should the shell automatically create a session at boot, so we don't have
    // two forms of shell going on ?

    const { create } = await artifact.actions<SApi>('session', artifact.pid)

    await t.step('prompt', async () => {
      const session = await create()
      const { engage } = await artifact.actions<EApi>('engage-help', pid)
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
