import OpenAI from 'openai'
import { Api, ENTRY_HELP_FILE, init as halInit } from '@/isolates/hal.ts'
import { init as githubInit } from '@/isolates/github.ts'
import * as engageHelp from '@/isolates/engage-help.ts'
import { expect, log } from '@utils'
import {
  addBranches,
  ArtifactBackchat,
  BranchMap,
  CradleMaker,
  getActorId,
  PID,
  print,
  SESSION_BRANCHES,
  SESSION_PATH,
} from '@/constants.ts'
import { ulid } from 'ulid'
type Messages = OpenAI.ChatCompletionMessageParam

const combinedInit = async (session: ArtifactBackchat) => {
  await Promise.all([githubInit(session), halInit(session)])
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
        SESSION_PATH,
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
        SESSION_PATH,
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
      await hal.prompt({
        text:
          'Update HAL to the latest version by using the engage-help function with "hal-system" as the help name and "Update HAL" as the prompt.  Dont ask me any questions, just do it using your best guess.',
      })
    })

    await terminal.engineStop()
  })

  Deno.test(prefix + 'double tool call with responses', async () => {
    const terminal = await cradleMaker()
    const { pid } = await terminal.init({ repo: 'test/doubleToolCall' })
    const help = `
---
commands:
  - io-fixture:ping
---

`
    await terminal.write('helps/double-test.md', help, pid)
    const isolate = 'engage-help'
    const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)
    const text =
      'call the provided "ping" tool twice with the message being the integer "1" for the first one and the integer "2" for the second'
    const result = await engage({ help: 'double-test', text })
    log('result', result)

    const session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
    log('session', session)

    expect(session).toHaveLength(5)
    const tool1 = session[2]
    const tool2 = session[3]
    expect(tool1.role).toBe('tool')
    expect(tool1.content).toBe('1')
    expect(tool2.role).toBe('tool')
    expect(tool2.content).toBe('2')

    await terminal.engineStop()
  })
  Deno.test(prefix + 'help in branch', async () => {
    const terminal = await cradleMaker()
    const { pid } = await terminal.init({ repo: 'test/helpInBranch' })
    const help = `
---
commands:
  - helps/help-in-branch
description: A test help used for exercising the system   
---
If you get asked to "Just say the number: 1" then you should respond with the number 1, otherwise you should do as requested.
`
    await terminal.write('helps/help-in-branch.md', help, pid)
    const isolate = 'engage-help'
    const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)
    const text =
      'call the "help-in-branch" function with: "Just say the number: 1"'
    const result = await engage({ help: 'help-in-branch', text })
    log('result %s', result)

    let session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
    log('session', session)

    const branches = await terminal.readJSON<BranchMap>(SESSION_BRANCHES, pid)
    log('branches', branches)
    expect(Object.values(branches)).toHaveLength(1)
    const [toolCallId, commit] = Object.entries(branches)[0]
    log('toolCallId', toolCallId)
    const helpPid = addBranches(pid, toolCallId)
    log('helpPid', print(helpPid))

    const branchSession = await terminal.readJSON<Messages[]>(
      SESSION_PATH,
      helpPid,
      commit,
    )
    log('branchSession', branchSession)
    expect(branchSession).toHaveLength(3)
    expect(branchSession[2].content).toBe('1')

    await expect(terminal.readJSON<Messages[]>(SESSION_PATH, helpPid))
      .rejects
      .toThrow('HEAD not found')

    session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
    log('session', session)
    expect(session).toHaveLength(5)
    const tool = session[3]
    expect(tool.role).toBe('tool')
    expect(tool.content).toBe('1')
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
