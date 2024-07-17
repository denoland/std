import { assert, expect, log } from '@utils'
import {
  addBranches,
  CradleMaker,
  generateThreadId,
  print,
} from '@/constants.ts'
import { Api } from '../isolates/thread.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':ai: '
  Deno.test(prefix + 'basic', async (t) => {
    const { backchat, engine } = await cradleMaker()
    log('pid', print(backchat.pid))

    await t.step('prompt', async () => {
      const { execute } = await backchat.actions<Api>('thread')
      const threadId = generateThreadId(t.name)
      const result = await execute({
        threadId,
        agentPath: 'agents/agent-fixture.md',
        content: 'say "Hello"',
      })
      expect(result).toBe('Hello')
    })
    log('stopping')
    await engine.stop()
    // TODO test using the backchat thread function directly
  })

  Deno.test('thread:execute', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const threadId = generateThreadId(t.name)
    const target = addBranches(backchat.pid, threadId)
    const threadPath = `threads/${threadId}.json`
    let latest = {}
    const splices = async () => {
      for await (const splice of backchat.read(target, threadPath)) {
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
    await t.step('say the word "hello"', async () => {
      const opts = { branchName: threadId, noClose: true }
      const { execute } = await backchat.actions<Api>('thread', opts)
      const result = await execute({
        threadId,
        agentPath: 'agents/agent-fixture.md',
        content: 'say the word: "hello" without calling any functions',
      })
      log('result', result)
      expect(result).toBe('hello')
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[2].content.toLowerCase()).toBe('hello')
    })

    const opts = { target }
    await t.step('what is your name ?', async () => {
      log('target', print(target))
      const { addMessageRun } = await backchat.actions<Api>('thread', opts)
      const result = await addMessageRun({
        threadId,
        content: 'what is your name ?',
      })
      log('result', result)

      const expected = `My name is Assistant.`
      expect(result).toBe(expected)
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[4].content).toBe(expected)
    })

    await t.step('repeat your last', async () => {
      const { addMessageRun } = await backchat.actions<Api>('thread', opts)
      const result = await addMessageRun({
        threadId,
        content: 'repeat your last, without calling any functions',
      })

      log('result', result)
      const expected = `My name is Assistant.`
      expect(result).toBe(expected)
      assert('messages' in latest, 'messages missing')
      assert(Array.isArray(latest.messages), 'messages not an array')
      expect(latest.messages[6].content).toBe(expected)
    })

    await engine.stop()
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
