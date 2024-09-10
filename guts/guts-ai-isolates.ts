import { expect, log } from '@utils'
import { CradleMaker } from '@/constants.ts'
import * as longthread from '@/isolates/longthread.ts'

const agent = `
---
commands:
- files:ls
- files:write
---
`

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':isolates: '
  const actorId = 'test'
  const path = 'agents/files.md'

  Deno.test(prefix + 'files:ls', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const target = await backchat.readBaseThread()
    await backchat.write(path, agent, target)
    await backchat.write('tmp', '', target)

    const { run } = await backchat.actions<longthread.Api>('longthread', {
      target,
    })
    await t.step('ls', async () => {
      const content = 'ls'
      const result = await run({ path, actorId, content })
      log('result', result)
      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      const thread = await backchat.readThread(target)
      log('thread', thread)
    })
    await t.step('ls .', async () => {
      const content = 'ls .'
      const result = await run({ path, actorId, content })
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      const thread = await backchat.readThread(target)
      log('thread', thread)
    })
    await t.step('ls /', async () => {
      const content = 'ls /'
      const result = await run({ path, actorId, content })
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')

      const thread = await backchat.readThread(target)
      log('thread', thread)
    })
    await t.step('ls --all', async () => {
      const content = 'ls --all'
      const result = await run({ path, actorId, content })
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).toContain('.io.json')

      const thread = await backchat.readThread(target)
      log('thread', thread)
    })
    await t.step('ls error', async () => {
      const content = 'ls ./nonexistent'
      const result = await run({ path, actorId, content })
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).not.toContain('.io.json')
      expect(result.content).toContain('does not exist')

      const thread = await backchat.readThread(target)
      log('thread', thread)
    })

    await engine.stop()
  })
  Deno.test(prefix + 'files:write', async (t) => {
    const { backchat, engine } = await cradleMaker()

    const target = await backchat.readBaseThread()
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
      const result = await run({ path, actorId, content })
      log('result', result)

      expect(typeof result.content).toBe('string')
      expect(result.content).toContain('test.txt')
    })

    await engine.stop()
  })
}
