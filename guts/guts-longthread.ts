import { assert, expect, log } from '@utils'
import { CradleMaker, print } from '@/constants.ts'
import { Api } from '../isolates/longthread.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':longthread: '
  Deno.test(prefix + 'basic', async (t) => {
    const { backchat, engine } = await cradleMaker()
    log('pid', print(backchat.pid))

    await t.step('prompt', async () => {
      const { start, run } = await backchat.actions<Api>('longthread')
      await start({})
      await run({
        path: 'agents/agent-fixture.md',
        content: 'say "Hello"',
        actorId: 'ai',
      })
      const thread = await backchat.readThread(backchat.pid)
      const assistant = thread.messages.pop()
      assert(assistant)
      expect(assistant.content).toContain('Hello')
    })
    log('stopping')
    await engine.stop()
    // TODO test using the backchat thread function directly
  })

  Deno.test(prefix + 'chat', async (t) => {
    const { backchat, engine } = await cradleMaker()

    const { start, run } = await backchat.actions<Api>('longthread')
    await start({})

    await t.step('say the word "hello"', async () => {
      await run({
        path: 'agents/agent-fixture.md',
        content: 'say the word: "hello" verbatim without calling any functions',
        actorId: 'ai',
      })
      const thread = await backchat.readThread(backchat.pid)
      expect(thread.messages).toHaveLength(2)

      const assistant = thread.messages.pop()
      assert(assistant)
      expect(assistant.content).toBe('hello')
    })

    await t.step('what is your name ?', async () => {
      await run({
        content: 'what is your name ?',
        path: 'agents/agent-fixture.md',
        actorId: 'ai',
      })
      const thread = await backchat.readThread(backchat.pid)
      expect(thread.messages).toHaveLength(4)
      const assistant = thread.messages.pop()
      assert(assistant)

      const expected = `Assistant`
      expect(assistant.content).toContain(expected)
    })

    await t.step('repeat your last', async () => {
      await run({
        content: 'repeat your last, without calling any functions',
        path: 'agents/agent-fixture.md',
        actorId: 'ai',
      })
      const thread = await backchat.readThread(backchat.pid)
      expect(thread.messages).toHaveLength(6)
      const assistant = thread.messages.pop()
      assert(assistant)

      const expected = `Assistant`
      expect(assistant.content).toContain(expected)
    })

    await engine.stop()
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
