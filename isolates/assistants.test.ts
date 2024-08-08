import { expect, log } from '@utils'
import { AssistantsThread, generateThreadId, getContent } from '../constants.ts'
import * as assistants from './assistants.ts'
import DB from '@/db.ts'
import { Engine } from '@/engine.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'

const agentMd = `
---
commands:
  - io-fixture:local
  - io-fixture:error
---
Only reply with a SINGLE word
`

const path = 'agents/agent-fixture.md'

Deno.test.ignore('assistants chat', async (t) => {
  const superuserKey = Crypto.generatePrivateKey()
  const aesKey = DB.generateAesKey()
  const privateKey = Crypto.generatePrivateKey()
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)

  const threadId = generateThreadId('assistants chat')
  const threadPath = `threads/${threadId}.json`
  const actorId = 'assistants'

  const assistants = await backchat.actions<assistants.Api>('assistants')

  await t.step('create assistant thread', async () => {
    await backchat.write(path, agentMd)
    await assistants.start({ threadId })
  })

  await t.step('hello world', async () => {
    const content = 'cheese emoji'
    await assistants.run({ threadId, path, content, actorId })
    const result = await backchat.readJSON<AssistantsThread>(threadPath)
    log('result', result)
    expect(result.messages).toHaveLength(2)
    expect(getContent(result.messages[1])).toBe('🧀')
  })

  await t.step('tool call', async () => {
    resetInstructions(backchat, 'return the function call results')
    const content = 'call the "local" function'

    await assistants.run({ threadId, path, content, actorId })

    const result = await backchat.readJSON<AssistantsThread>(threadPath)
    log('result', result)
    // expect(fn.function).toEqual({ name: 'io-fixture_local', arguments: '{}' })
  })
  await assistants.delete({ threadId })
  await assistants.deleteAllAgents()
  await engine.stop()
})

const resetInstructions = (backchat: Backchat, instructions: string) => {
  const split = agentMd.trim().split('\n')
  split.pop()
  split.push(instructions)
  const newInstructions = split.join('\n')
  backchat.write(path, newInstructions)
}
