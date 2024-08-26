import { assert, expect, log } from '@utils'
import {
  addBranches,
  Backchat,
  CradleMaker,
  generateThreadId,
  PID,
  print,
  Thread,
} from '@/constants.ts'
import { Api } from '../isolates/longthread.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':longthread: '
  Deno.test(prefix + 'basic', async (t) => {
    const { backchat, engine } = await cradleMaker()
    log('pid', print(backchat.pid))

    await t.step('prompt', async () => {
      const { start, run } = await backchat.actions<Api>('longthread')
      const threadId = generateThreadId(t.name)
      await start({})
      await run({
        path: 'agents/agent-fixture.md',
        content: 'say "Hello"',
        actorId: 'ai',
      })
      const result = await backchat.readJSON<Thread>(`threads/${threadId}.json`)
      const [assistant] = result.messages.slice(-1)
      expect(assistant.content).toContain('Hello')
    })
    log('stopping')
    await engine.stop()
    // TODO test using the backchat thread function directly
  })

  Deno.test(prefix + 'thread:execute', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const threadId = generateThreadId(t.name)
    const target = addBranches(backchat.pid, threadId)
    const threadPath = `threads/${threadId}.json`
    const read = readAssistant(backchat, target, threadPath)
    let latest = {}
    const splices = async () => {
      for await (const splice of backchat.watch(target, threadPath)) {
        if (!Object.keys(splice.changes).length) {
          continue
        }
        if (splice.changes[threadPath]) {
          const { patch } = splice.changes[threadPath]
          assert(patch, 'patch missing')
          latest = JSON.parse(patch)
          log('splice', splice.oid)
        }
      }
    }
    splices()
    await t.step('start thread', async () => {
      const opts = { branchName: threadId, noClose: true }
      const { start } = await backchat.actions<Api>('longthread', opts)
      await start({})
    })
    const { run } = await backchat.actions<Api>('longthread', { target })
    await t.step('say the word "hello"', async () => {
      await run({
        path: 'agents/agent-fixture.md',
        content: 'say the word: "hello" verbatim without calling any functions',
        actorId: 'ai',
      })
      const assistant = await read()
      expect(assistant.content).toBe('hello')
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[1].content.toLowerCase()).toBe('hello')
    })

    await t.step('what is your name ?', async () => {
      log('target', print(target))
      await run({
        content: 'what is your name ?',
        path: 'agents/agent-fixture.md',
        actorId: 'ai',
      })
      const assistant = await read()
      const expected = `Assistant.`
      expect(assistant.content).toBe(expected)
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[3].content).toBe(expected)
    })

    await t.step('repeat your last', async () => {
      await run({
        content: 'repeat your last, without calling any functions',
        path: 'agents/agent-fixture.md',
        actorId: 'ai',
      })
      const assistant = await read()
      const expected = `Assistant.`
      expect(assistant.content).toBe(expected)
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[5].content).toBe(expected)
    })

    await engine.stop()
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system

const readAssistant = (backchat: Backchat, target: PID, threadPath: string) => {
  return async () => {
    const result = await backchat.readJSON<Thread>(
      threadPath,
      target,
    )
    const [assistant] = result.messages.slice(-1)
    return assistant
  }
}
