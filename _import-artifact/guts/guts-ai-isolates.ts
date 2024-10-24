import { assert, expect, log } from '@utils'
import { CradleMaker, getParent } from '@/constants.ts'
import * as longthread from '@/isolates/longthread.ts'
import * as system from '@/isolates/system.ts'

const agent = `
---
commands:
- files:ls
- files:write
---
`

export default (cradleMaker: CradleMaker) => {
  const prefix = 'isolates: '
  const actorId = 'test'
  const path = 'agents/files.md'

  Deno.test(prefix + 'files:ls', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const target = await backchat.threadPID()
    await backchat.write(path, agent, target)
    await backchat.write('tmp', '', target)

    const { run } = await backchat.actions<longthread.Api>('longthread', {
      target,
    })
    await t.step('ls', async () => {
      const content = 'ls'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      log('result', result)
      assert(result)
      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      log('thread', thread)
    })
    await t.step('ls .', async () => {
      const content = 'ls .'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      assert(result)
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      log('thread', thread)
    })
    await t.step('ls /', async () => {
      const content = 'ls /'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      assert(result)
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      log('thread', thread)
    })
    await t.step('ls --all', async () => {
      const content = 'ls --all'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      log('result', result)
      assert(result)

      expect(typeof result.content).toBe('string')
      expect(result.content).toContain('.io.json')

      log('thread', thread)
    })
    await t.step('ls error', async () => {
      const content = 'ls ./nonexistent'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      assert(result)
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).toContain('does not exist')

      log('thread', thread)
    })
  })
  Deno.test(prefix + 'files:write', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle

    const target = await backchat.threadPID()
    await backchat.write(path, agent, target)

    const { run } = await backchat.actions<longthread.Api>('longthread', {
      target,
    })

    await t.step('write', async () => {
      const content = 'write "c" to the file test.txt'
      const result = await run({ path, actorId, content })
      log('result', result)

      const read = await backchat.read('test.txt', target)
      expect(read).toBe('c')
    })

    await t.step('ls', async () => {
      const content = 'ls'
      await run({ path, actorId, content })
      const thread = await backchat.readThread(target)
      const result = thread.messages.pop()
      assert(result)
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).toContain('test.txt')
    })
  })
  Deno.test(prefix + 'system:merge*', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const target = await backchat.threadPID()
    const parent = getParent(target)

    const actions = await backchat.actions<system.Api>('system', { target })
    const { mergeParent, mergeGrandParent } = actions

    await t.step('mergeParent', async () => {
      const result = await mergeParent({})
      log('result', result)

      expect(result).toBeDefined()
      const [splice] = await backchat.splices(parent)
      expect(result.head).toBe(splice.oid)
    })
    await t.step('mergeGrandParent', async () => {
      const result = await mergeGrandParent({})
      log('result', result)

      expect(result).toBeDefined()
      const grandParent = getParent(getParent(target))
      const [splice] = await backchat.splices(grandParent)
      expect(result.head).toBe(splice.oid)
    })
    await t.step('mergeParent with conflicts', async () => {
      await backchat.write('test.txt', 'parent', parent)

      await backchat.write('test.txt', 'target', target)

      const result = await mergeParent({})
      log('result', result)

      expect(result).toBeDefined()
      const [splice] = await backchat.splices(parent)
      expect(result.head).toBe(splice.oid)
    })
  })
}
