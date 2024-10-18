import { expect, log } from '@utils'
import { CradleMaker } from '@/constants.ts'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'focus: '

  // TODO make a remote thread, and then test summoner

  Deno.test(prefix + 'thread management', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    let focus = await backchat.threadPID()
    log('initial focus', focus)
    const thread = await backchat.readThread()
    expect(thread.agent).toBe('agents/reasoner.md')

    await t.step('first thread, files agent', async () => {
      expect(focus).toBeDefined()
      await backchat.prompt('hello')
      const next = await backchat.threadPID()
      expect(next).toEqual(focus)
    })

    await t.step('second thread', async () => {
      await backchat.prompt('start a new thread')
      const next = await backchat.threadPID()
      expect(next).not.toEqual(focus)
      focus = next
    })

    await t.step('list files in second thread', async () => {
      await backchat.prompt('list the files I have')
      const next = await backchat.threadPID()
      expect(next).toEqual(focus)
    })

    // TODO enable after providing thread search ability
    // await t.step('restart a thread', async () => {
    //   const result = await backchat.prompt('switch me back to the first thread')
    //   log('result', result)
    // const next = await backchat.readBaseThread()
    // expect(next).not.toEqual(focus)
    // expect(next).toEqual(initialFocus)
    // focus = next
    // })

    // test changing some files then have that show up on the other thread

    // TODO test deleted / nonexistent thread
  })

  Deno.test(prefix + 'update from github', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle

    await t.step('update', async () => {
      await backchat.prompt(
        'Update the HAL repo to the latest version by using the system agent as an administrative action',
      )
    })
  })

  // TODO move this to be an md test
  Deno.test(prefix + 'infinite loop regression', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle

    await t.step('infinite loop', async () => {
      const prompt =
        'Write a file with the following text "I love to be in Paris in the Spring". Then save it as paris.txt. Then replace all text in that file where "Paris" occurs with "Edinburgh". Then rename the file Edinburgh.txt'
      await backchat.prompt(prompt)

      const target = await backchat.threadPID()

      const listing = await backchat.ls({ target })
      expect(listing).toContain('Edinburgh.txt')

      const edinburgh = await backchat.read('Edinburgh.txt', target)
      expect(edinburgh).toContain('I love to be in Edinburgh in the Spring')
    })
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
