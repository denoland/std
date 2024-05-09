import OpenAI from 'openai'
import { ENTRY_HELP_FILE, HalActor, HalSession } from '@/isolates/hal.ts'
import { expect, log } from '@utils'
import { ArtifactSession, print } from '@/constants.ts'
type Messages = OpenAI.ChatCompletionMessageParam

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'hal', async (t) => {
    const session = await cradleMaker()
    const repo = 'dreamcatcher-tech/HAL'
    const { pid } = await session.clone({ repo })

    const halBase = await session.actions<HalActor>('hal', pid)
    const halSessionPid = await halBase.startSession()
    const hal = await session.actions<HalSession>('hal', halSessionPid)

    await t.step('prompt', async () => {
      log('pid', print(halSessionPid))
      await hal.prompt({ text: 'hello' })
      const messages = await session.readJSON<Messages[]>(
        'session.json',
        halSessionPid,
      )
      log('messages', messages)
    })

    await t.step('redirect HAL', async () => {
      const sessionBase = await session.actions<HalSession>(
        'hal',
        halSessionPid,
      )
      await expect(session.exists(ENTRY_HELP_FILE, halSessionPid)).resolves
        .toBe(false)
      await sessionBase.setPromptTarget({ help: 'help-fixture' })
      await expect(session.exists(ENTRY_HELP_FILE, halSessionPid)).resolves
        .toBe(true)

      await hal.prompt({ text: 'hello again' })
      const messages = await session.readJSON<Messages[]>(
        'session.json',
        halSessionPid,
      )
      log('messages', messages)
    })

    await session.engineStop()
  })

  // use HAL to write a new prompt for HAL, and then use that ?
  // use HAL to improve the goalie.json file, so next time it gets used as default
  // PR the changed files against the users base defaults
  // PR the users base defaults against the full HAL repo

  // really want to work on a branch of HAL from a safe place, where it is doing
  // writes and reads to a fork, and testing things out in safety before changing
  // its own programming.
}
