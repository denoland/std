import { expect, log } from '@utils'
import { CradleMaker } from '@/constants.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':focus: '

  // TODO make a fake thread, and then test summoner

  Deno.test.only(prefix + 'thread management', async (t) => {
    const { backchat, engine } = await cradleMaker()
    let focus = await backchat.readBaseThread()
    log.enable('AI:tests AI:backchat AI:longthread AI:agents')
    log('initial focus', focus)

    await t.step('first thread, files agent', async () => {
      expect(focus).toBeDefined()
      await backchat.prompt('hey what files have I got ?')
      const next = await backchat.readBaseThread()
      expect(next).toEqual(focus)
      focus = next
    })

    await t.step('second thread', async () => {
      await backchat.prompt('start a new thread')
      const next = await backchat.readBaseThread()
      expect(next).not.toEqual(focus)
      focus = next
    })
    await t.step('list files in second thread', async () => {
      await backchat.prompt('files list')
      const next = await backchat.readBaseThread()
      expect(next).toEqual(focus)
    })

    // await t.step('restart a thread', async () => {
    //   const result = await backchat.prompt(
    //     'backchat switch me back to the first thread',
    //   )
    //   log('result', result)
    //   focus = await getFocus(backchat, focus)
    // })

    // test changing some files then have that show up on the other thread

    // TODO test valid format but deleted / nonexistent session
    await engine.stop()
  })

  Deno.test(prefix + 'update from github', async (t) => {
    const { backchat, engine } = await cradleMaker()
    // this test should cover passing on extra instructions to backchat
    // it should go find the github bot, and call it with some base
    // instructions
    await t.step('update', async () => {
      await backchat.prompt(
        'Update HAL to the latest version by using the engage-help function with "hal-system" as the help name and "Update HAL" as the prompt.  Dont ask me any questions, just do it using your best guess.',
      )
    })

    await engine.stop()
  })

  // TODO move this to be an md test
  Deno.test(prefix + 'infinite loop regression', async (t) => {
    const { backchat, engine } = await cradleMaker()
    await t.step('infinite loop', async () => {
      await backchat.prompt(
        'backchat start a thread with the agent: agents/files.md',
      )
      const prompt =
        'Write a file with the following text "I love to be in Paris in the Spring". Then save it as paris.txt. Then replace all text in that file where "Paris" occurs with "Edinburgh". Then rename the file Edinburgh.txt'
      await backchat.prompt(prompt)

      const target = await backchat.readBaseThread()

      const listing = await backchat.ls({ target })
      expect(listing).toContain('Edinburgh.txt')

      const edinburgh = await backchat.read('Edinburgh.txt', target)
      expect(edinburgh).toEqual('I love to be in Edinburgh in the Spring')
    })
    await engine.stop()
  })

  //   Deno.test(prefix + 'double tool call with responses', async () => {
  //     const terminal = await cradleMaker()
  //     const { pid } = await terminal.init({ repo: 'test/doubleToolCall' })
  //     const help = `
  // ---
  // commands:
  //   - io-fixture:ping
  // ---

  // `
  //     await terminal.write('helps/double-test.md', help, pid)
  //     const isolate = 'engage-help'
  //     const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)
  //     const text =
  //       'call the provided "ping" tool twice with the message being the integer "1" for the first one and the integer "2" for the second'
  //     const result = await engage({ help: 'double-test', text })
  //     log('result', result)

  //     const session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
  //     log('session', session)

  //     expect(session).toHaveLength(5)
  //     const tool1 = session[2]
  //     const tool2 = session[3]
  //     expect(tool1.role).toBe('tool')
  //     expect(tool1.content).toBe('1')
  //     expect(tool2.role).toBe('tool')
  //     expect(tool2.content).toBe('2')

  //     await terminal.engineStop()
  //   })
  //   Deno.test(prefix + 'help in branch', async () => {
  //     const terminal = await cradleMaker()
  //     const { pid } = await terminal.init({ repo: 'test/helpInBranch' })
  //     const help = `
  // ---
  // commands:
  //   - helps/help-in-branch
  // description: A test help used for exercising the system
  // ---
  // If you get asked to "Just say the number: 1" then you should respond with the number 1, otherwise you should do as requested.
  // `
  //     await terminal.write('helps/help-in-branch.md', help, pid)
  //     const isolate = 'engage-help'
  //     const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)
  //     const text =
  //       'call the "help-in-branch" function with: "Just say the number: 1"'
  //     const result = await engage({ help: 'help-in-branch', text })
  //     log('result %s', result)

  //     let session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
  //     log('session', session)

  //     const branches = await terminal.readJSON<BranchMap>(SESSION_BRANCHES, pid)
  //     log('branches', branches)
  //     expect(Object.values(branches)).toHaveLength(1)
  //     const [toolCallId, commit] = Object.entries(branches)[0]
  //     log('toolCallId', toolCallId)
  //     const helpPid = addBranches(pid, toolCallId)
  //     log('helpPid', print(helpPid))

  //     const branchSession = await terminal.readJSON<Messages[]>(
  //       SESSION_PATH,
  //       helpPid,
  //       commit,
  //     )
  //     log('branchSession', branchSession)
  //     expect(branchSession).toHaveLength(3)
  //     expect(branchSession[2].content).toBe('1')

  //     await expect(terminal.readJSON<Messages[]>(SESSION_PATH, helpPid))
  //       .rejects
  //       .toThrow('HEAD not found')

  //     session = await terminal.readJSON<Messages[]>(SESSION_PATH, pid)
  //     log('session', session)
  //     expect(session).toHaveLength(5)
  //     const tool = session[3]
  //     expect(tool.role).toBe('tool')
  //     expect(tool.content).toBe('1')
  //     await terminal.engineStop()
  //   })

  // use HAL to write a new prompt for HAL, and then use that ?
  // use HAL to improve the goalie.json file, so next time it gets used as
  // default
  // PR the changed files against the users base defaults
  // PR the users base defaults against the full HAL repo

  // really want to work on a branch of HAL from a safe place, where it is doing
  // writes and reads to a fork, and testing things out in safety before
  // changing its own programming.
}
