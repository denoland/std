import OpenAI from 'openai'
import {
  ENTRY_HELP_FILE,
  HalActor,
  HalBase,
  HalSession,
  init,
} from '@/isolates/hal.ts'
import { init as githubInit } from '@/isolates/github.ts'
import { expect, log } from '@utils'
import { ArtifactSession, CradleMaker, print } from '@/constants.ts'
type Messages = OpenAI.ChatCompletionMessageParam

const combinedInit = async (session: ArtifactSession) => {
  await Promise.all([githubInit(session), init(session)])
}

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '

  Deno.test(prefix + 'login loop', async (t) => {
    const session = await cradleMaker(combinedInit)
    const pid = await session.dns('dreamcatcher-tech/HAL')

    const halBase = await session.actions<HalBase>('hal', pid)
    const actorAddress = await halBase.createActor()
    log('actorAddress', print(actorAddress))

    const halActor = await session.actions<HalActor>('hal', actorAddress)

    const sessionAddress = await halActor.startSession()
    const hal = await session.actions<HalSession>('hal', sessionAddress)

    await hal.prompt({ text: 'hello' })

    await t.step('second session', async () => {
      const second = session.newSession()
      log('second session', print(second.pid))
      const halActor = await second.actions<HalActor>('hal', actorAddress)
      const sessionAddress = await halActor.startSession()
      const hal = await second.actions<HalSession>('hal', sessionAddress)
      await hal.prompt({ text: 'hello' })
    })

    await t.step('restart a session', async () => {
      log('resuming session', print(session.pid))
      const resumed = session.resumeSession(session.pid)
      const hal = await resumed.actions<HalSession>('hal', sessionAddress)
      await hal.prompt({ text: 'hello' })
    })

    await t.step('invalid session', () => {
      const branches = session.pid.branches.slice(0, -1)
      branches.push('invalid ulid')
      const pid = { ...session.pid, branches }
      expect(() => session.resumeSession(pid)).toThrow('invalid session')
    })
    // TODO test valid format but deleted / nonexistent session
    // TODO test invalid machine
    await session.engineStop()
  })

  Deno.test(prefix + 'hal', async (t) => {
    const session = await cradleMaker()
    await session.rm({ repo: 'dreamcatcher-tech/HAL' })
    const { pid } = await session.clone({ repo: 'dreamcatcher-tech/HAL' })

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
