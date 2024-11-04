import { assert, expect, log } from '@utils'
import { CradleMaker, print } from '@/constants.ts'
import { Api } from '../openai/longthread.ts'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'longthread: '
  Deno.test(prefix + 'basic', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
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
    // TODO test using the backchat thread function directly
  })

  Deno.test(prefix + 'chat', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle

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
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
