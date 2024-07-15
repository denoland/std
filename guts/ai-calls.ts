import { assert, expect, log } from '@utils'
import { addBranches, CradleMaker, print, randomId } from '@/constants.ts'
import { Api } from '../isolates/thread.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'ai', async (t) => {
    const { backchat, engine } = await cradleMaker()
    log('pid', print(backchat.pid))

    await t.step('prompt', async () => {
      const { execute } = await backchat.actions<Api>('thread')
      const threadId = `thr_${randomId()}`
      const result = await execute({
        threadId,
        agentPath: 'agents/goalie.md',
        content: 'hello',
      })
      console.log('result', result)
    })
    log('stopping')
    await engine.stop()
    // TODO test using the backchat thread function directly
  })

  Deno.test('thread:execute', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const threadId = `thr_${randomId()}`
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
          log('splice', splice.oid, latest)
        }
      }
    }
    splices()
    await t.step('say the word "hello"', async () => {
      const { execute } = await backchat.actions<Api>('thread')
      await execute({
        threadId,
        agentPath: 'agents/agent-fixture.md',
        content: 'say the word: "hello" without calling any functions',
      })
      log('result', latest)
      assert(Array.isArray(latest))
      expect(latest[2].content.toLowerCase()).toBe('hello')
    })
    await t.step('what is your name ?', async () => {
      const { execute } = await backchat.actions<Api>('thread')
      await execute({
        threadId,
        agentPath: 'agents/agent-fixture.md',
        content: 'what is your name ?',
      })
      assert(Array.isArray(latest))
    })

    await t.step('repeat your last', async () => {
      const { execute } = await backchat.actions<Api>('thread')
      await execute({
        threadId,
        agentPath: 'agents/agent-fixture.md',
        content: 'repeat your last, without calling any functions',
      })

      log('result', latest)
      assert(Array.isArray(latest))
    })

    await engine.stop()
  })
}

// add a user to the system
// add an anonymous user before they log in
// let the user log in to the system
