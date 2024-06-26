// tests for calling isolates using AI calls

import OpenAI from 'openai'
import * as engageHelp from '@/isolates/engage-help.ts'
import { expect, log } from '@utils'
import { CradleMaker, SESSION_PATH } from '@/constants.ts'
type Messages = OpenAI.ChatCompletionMessageParam

const help = `
---
commands:
- files:ls
- files:write
---
`

export default (name: string, cradleMaker: CradleMaker) => {
    const prefix = name + ': '
    Deno.test(prefix + 'files:ls', async (t) => {
        const terminal = await cradleMaker()

        const { pid } = await terminal.clone({ repo: 'dreamcatcher-tech/HAL' })
        await terminal.write('helps/files.md', help, pid)
        await terminal.write('tmp', '', pid)
        const isolate = 'engage-help'

        const { engage } = await terminal.actions<engageHelp.Api>(isolate, pid)
        await t.step('ls', async () => {
            const text = 'ls'
            const result = await engage({ help: 'files', text })
            log('result', result)
            expect(result).not.toContain('.io.json')

            const session = await terminal.readJSON<Messages[]>(
                SESSION_PATH,
                pid,
            )
            log('session', session)
            await terminal.delete(SESSION_PATH, pid)
        })
        await t.step('ls .', async () => {
            const text = 'ls .'
            const result = await engage({ help: 'files', text })
            log('result', result)
            expect(result).not.toContain('.io.json')

            const session = await terminal.readJSON<Messages[]>(
                SESSION_PATH,
                pid,
            )
            log('session', session)
            await terminal.delete(SESSION_PATH, pid)
        })
        await t.step('ls /', async () => {
            const text = 'ls /'
            const result = await engage({ help: 'files', text })
            log('result', result)
            expect(result).not.toContain('.io.json')

            const session = await terminal.readJSON<Messages[]>(
                SESSION_PATH,
                pid,
            )
            log('session', session)
            await terminal.delete(SESSION_PATH, pid)
        })
        await t.step('ls --all', async () => {
            const text = 'ls --all'
            const result = await engage({ help: 'files', text })
            log('result', result)
            expect(result).toContain('.io.json')

            const session = await terminal.readJSON<Messages[]>(
                SESSION_PATH,
                pid,
            )
            log('session', session)
            await terminal.delete(SESSION_PATH, pid)
        })

        await terminal.engineStop()
    })
    Deno.test(prefix + 'files:write', async (t) => {
        const terminal = await cradleMaker()
        const { pid } = await terminal.init({ repo: 'test/write' })
        await terminal.write('helps/files.md', help, pid)
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
