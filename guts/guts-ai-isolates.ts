import OpenAI from 'openai'
import * as engageHelp from '../isolates/thread.ts'
import { expect, log } from '@utils'
import { CradleMaker, getParent } from '@/constants.ts'
type Messages = OpenAI.ChatCompletionMessageParam

const agent = `
---
commands:
- files:ls
- files:write
---
`

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':isolates: '
  Deno.test.only(prefix + 'files:ls', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const actor = getParent(backchat.pid)
    await backchat.write('agents/files.md', agent, actor)
    await backchat.write('tmp', '', actor)

    const { engage } = await backchat.actions<engageHelp.Api>('thread', pid)
    await t.step('ls', async () => {
      const text = 'ls'
      const result = await engage({ help: 'files', text })
      log('result', result)
      expect(result).not.toContain('.io.json')

      const session = await backchat.readJSON<Messages[]>(
        SESSION_PATH,
        pid,
      )
      log('session', session)
      await backchat.delete(SESSION_PATH, pid)
    })
    await t.step('ls .', async () => {
      const text = 'ls .'
      const result = await engage({ help: 'files', text })
      log('result', result)
      expect(result).not.toContain('.io.json')

      const session = await backchat.readJSON<Messages[]>(
        SESSION_PATH,
        pid,
      )
      log('session', session)
      await backchat.delete(SESSION_PATH, pid)
    })
    await t.step('ls /', async () => {
      const text = 'ls /'
      const result = await engage({ help: 'files', text })
      log('result', result)
      expect(result).not.toContain('.io.json')

      const session = await backchat.readJSON<Messages[]>(
        SESSION_PATH,
        pid,
      )
      log('session', session)
      await backchat.delete(SESSION_PATH, pid)
    })
    await t.step('ls --all', async () => {
      const text = 'ls --all'
      const result = await engage({ help: 'files', text })
      log('result', result)
      expect(result).toContain('.io.json')

      const session = await backchat.readJSON<Messages[]>(
        SESSION_PATH,
        pid,
      )
      log('session', session)
      await backchat.delete(SESSION_PATH, pid)
    })

    await engine.stop()
  })
  Deno.test(prefix + 'files:write', async (t) => {
    const terminal = await cradleMaker()
    const { pid } = await terminal.init({ repo: 'test/write' })
    await terminal.write('helps/files.md', agent, pid)
    const isolate = 'engage-help'
    const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)

    await t.step('write', async () => {
      const text = 'write "c" to the file test.txt'
      const result = await engage({ help: 'files', text })
      log('result', result)
      await terminal.delete(SESSION_PATH, pid)
    })

    await t.step('ls', async () => {
      const text = 'ls'
      const result = await engage({ help: 'files', text })
      log('result', result)
      expect(result).toContain('test.txt')

      await terminal.delete(SESSION_PATH, pid)
    })

    await terminal.engineStop()
  })
}
