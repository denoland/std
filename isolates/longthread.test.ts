import { expect, log } from '@utils'
import { generateThreadId, Thread } from '../constants.ts'
import * as longthread from './longthread.ts'
import DB from '@/db.ts'
import { Engine } from '@/engine.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'
import { assert } from '@std/assert'
const agentMd = `
---
commands:
  - io-fixture:local
  - io-fixture:error
---
Only reply with a SINGLE word
`
const doubleToolCall = `
---
commands:
  - io-fixture:ping
---
`
const path = 'agents/agent-fixture.md'

Deno.test('longthread chat', async (t) => {
  const superuserKey = Crypto.generatePrivateKey()
  const aesKey = DB.generateAesKey()
  const privateKey = Crypto.generatePrivateKey()
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)

  const threadId = generateThreadId('longthread chat')
  const threadPath = `threads/${threadId}.json`
  const actorId = 'longthread'

  const longthread = await backchat.actions<longthread.Api>('longthread')

  await t.step('create longthread', async () => {
    await backchat.write(path, agentMd)
    await longthread.start({ threadId })
  })
  await t.step('start twice errors', async () => {
    await expect(longthread.start({ threadId }))
      .rejects.toThrow('thread exists')
  })

  await t.step('hello world', async () => {
    const content = 'cheese emoji'
    await longthread.run({ threadId, path, content, actorId })
    const result = await backchat.readJSON<Thread>(threadPath)
    log('result', result)
    expect(result.messages).toHaveLength(2)
    expect(result.messages[1].content).toBe('🧀')
  })

  await t.step('tool call', async () => {
    resetInstructions(backchat, 'return the function call results')
    const content = 'call the "local" function'

    await longthread.run({ threadId, path, content, actorId })

    const result = await backchat.readJSON<Thread>(threadPath)
    expect(result).toHaveProperty('toolCommits')
    expect(Object.keys(result.toolCommits)).toHaveLength(1)

    const [assistant] = result.messages.slice(-3)
    assert(assistant.role === 'assistant', 'tool calls missing')
    assert(assistant.tool_calls)

    expect(assistant.tool_calls).toHaveLength(1)
    expect(assistant.tool_calls[0].function).toEqual({
      name: 'io-fixture_local',
      arguments: '{}',
    })
  })
  await t.step('tool error', async () => {
    resetInstructions(backchat, 'return the function call error message')
    const content = 'call the "error" function with message: salami'

    await longthread.run({ threadId, path, content, actorId })

    const result = await backchat.readJSON<Thread>(threadPath)

    const [assistant, error] = result.messages.slice(-3)
    assert(assistant.role === 'assistant', 'tool calls missing')
    assert(assistant.tool_calls)
    expect(assistant.tool_calls).toHaveLength(1)
    expect(assistant.tool_calls[0].function).toEqual({
      name: 'io-fixture_error',
      arguments: '{"message":"salami"}',
    })

    assert(error.role === 'tool', 'tool calls missing')
    expect(error.content)
      .toBe('{\n  "name": "Error",\n  "message": "salami"\n}')
  })
  await t.step('double tool call', async () => {
    const content =
      'call the "ping" function twice with the message being the integer "1" for the first one and the integer "2" for the second'
    backchat.write(path, doubleToolCall)

    await longthread.run({ threadId, path, content, actorId })
    const result = await backchat.readJSON<Thread>(threadPath)

    const [assistant] = result.messages.slice(-4)
    assert(assistant.role === 'assistant', 'tool calls missing')
    assert(assistant.tool_calls)

    expect(assistant.tool_calls).toHaveLength(2)
    const fn0 = assistant.tool_calls[0]
    const fn1 = assistant.tool_calls[1]
    expect(fn0.function).toEqual({
      name: 'io-fixture_ping',
      arguments: '{"message": "1"}',
    })
    expect(fn1.function).toEqual({
      name: 'io-fixture_ping',
      arguments: '{"message": "2"}',
    })
  })
  await engine.stop()
})

const resetInstructions = (backchat: Backchat, instructions: string) => {
  const split = agentMd.trim().split('\n')
  split.pop()
  split.push(instructions)
  const newInstructions = split.join('\n')
  backchat.write(path, newInstructions)
}
