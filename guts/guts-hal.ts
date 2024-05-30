import OpenAI from 'openai'
import { Api, ENTRY_HELP_FILE, init } from '@/isolates/hal.ts'
import { init as githubInit } from '@/isolates/github.ts'
import { expect, log } from '@utils'
import {
  ArtifactTerminal,
  CradleMaker,
  getActorId,
  PID,
  print,
} from '@/constants.ts'
import { ulid } from 'ulid'
type Messages = OpenAI.ChatCompletionMessageParam

const combinedInit = async (session: ArtifactTerminal) => {
  await Promise.all([githubInit(session), init(session)])
}

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '

  Deno.test(prefix + 'session management', async (t) => {
    const terminal = await cradleMaker(combinedInit)
    const halPid = await terminal.dns('dreamcatcher-tech/HAL')

    const session = createHalSessionPid(terminal.pid, halPid)
    log('HAL session request', print(session))

    await terminal.ensureBranch(session, halPid)
    const hal = await terminal.actions<Api>('hal', session)

    log('prompting')
    await hal.prompt({ text: 'hello' })

    await t.step('second session', async () => {
      const second = terminal.newTerminal()
      log('second session', print(second.pid))
      expect(second.pid).not.toEqual(terminal.pid)
      const session2 = createHalSessionPid(second.pid, halPid)
      log('HAL session request', print(session2))
      expect(session2).not.toEqual(session)
      await second.ensureBranch(session2, halPid)
      log('prompting')
      const hal = await second.actions<Api>('hal', session2)
      await hal.prompt({ text: 'hello' })
    })

    await t.step('restart a session', async () => {
      log('resuming session', print(terminal.pid))
      const resumed = terminal.resumeTerminal(terminal.pid)
      const hal = await resumed.actions<Api>('hal', session)
      await hal.prompt({ text: 'hello' })
    })

    // TODO test valid format but deleted / nonexistent session
    // TODO test invalid machine
    await terminal.engineStop()
  })

  Deno.test(prefix + 'HAL prompt redirection', async (t) => {
    const terminal = await cradleMaker()
    await terminal.rm({ repo: 'dreamcatcher-tech/HAL' })
    const { pid } = await terminal.clone({ repo: 'dreamcatcher-tech/HAL' })
    const session = createHalSessionPid(terminal.pid, pid)
    await terminal.ensureBranch(session, pid)
    const hal = await terminal.actions<Api>('hal', session)

    await t.step('prompt', async () => {
      log('pid', print(session))
      await hal.prompt({ text: 'hello' })
      const messages = await terminal.readJSON<Messages[]>(
        'session.json',
        session,
      )
      log('messages', messages)
    })

    await t.step('redirect HAL', async () => {
      const sessionBase = await terminal.actions<Api>(
        'hal',
        session,
      )
      await expect(terminal.exists(ENTRY_HELP_FILE, session)).resolves
        .toBeTruthy()
      await sessionBase.setPromptTarget({ help: 'help-fixture' })
      await expect(terminal.exists(ENTRY_HELP_FILE, session)).resolves
        .toBeTruthy()

      await hal.prompt({ text: 'hello again' })
      const messages = await terminal.readJSON<Messages[]>(
        'session.json',
        session,
      )
      log('messages', messages)
    })
    await terminal.engineStop()
  })
  Deno.test(prefix + 'update from github', async (t) => {
    const terminal = await cradleMaker()
    await terminal.rm({ repo: 'dreamcatcher-tech/HAL' })
    const { pid } = await terminal.clone({ repo: 'dreamcatcher-tech/HAL' })
    const session = createHalSessionPid(terminal.pid, pid)
    await terminal.ensureBranch(session, pid)
    const hal = await terminal.actions<Api>('hal', session)

    await t.step('update', async () => {
      // log.enable(
      // 'AI:completions AI:tools:* *:ai-result-content AI:qbr* AI:system',
      // )
      await hal.prompt({
        text:
          'Update HAL to the latest version by using the engage-help function with "hal-system" as the help name and "Update HAL" as the prompt.  Dont ask me any questions, just do it using your best guess.',
      })

      // const messages = await terminal.readJSON<Messages[]>(
      //   'session.json',
      //   session,
      // )
      // console.dir(messages, { depth: Infinity })
    })

    await terminal.engineStop()
  })
  // use HAL to write a new prompt for HAL, and then use that ?
  // use HAL to improve the goalie.json file, so next time it gets used as default
  // PR the changed files against the users base defaults
  // PR the users base defaults against the full HAL repo

  // really want to work on a branch of HAL from a safe place, where it is doing
  // writes and reads to a fork, and testing things out in safety before changing
  // its own programming.
}
const createHalSessionPid = (terminal: PID, halBase: PID) => {
  const actorId = getActorId(terminal)
  const branches = [...halBase.branches, actorId, ulid()]
  return { ...halBase, branches }
}
