import { assert, expect, log } from '@utils'
import IA from '../isolate-api.ts'
import { generateThreadId, partialFromRepo, Thread } from '../constants.ts'
import * as completions from './ai-completions.ts'
import * as thread from './thread.ts'
import FS from '@/git/fs.ts'
import DB from '@/db.ts'
import Accumulator from '@/exe/accumulator.ts'

const agentMd = `
---
commands:
  - io-fixture:local
  - io-fixture:error
---
Only reply with a SINGLE word
`
const threadId = generateThreadId()
// const threadPath = 'threads/thread-test.json'
const agentPath = 'agents/agent-fixture.md'

Deno.test('ai-chat', async (t) => {
  const db = await DB.create(DB.generateAesKey())
  const partialPid = partialFromRepo('runner/test')
  const fs = await FS.init(partialPid, db)
  const accumulator = Accumulator.create(fs)
  const api = IA.create(accumulator)
  accumulator.activate(Symbol())

  await t.step('create thread', async () => {
    api.write(agentPath, agentMd)
    await thread.functions.start({ threadId, agentPath }, api)
  })

  await t.step('hello world', async () => {
    const content = 'cheese emoji'
    await thread.functions.addMessage({ threadId, content }, api)
    await completions.functions.complete({ threadId }, api)
    const result = await api.readJSON<Thread>(threadPath)
    log('result', result)
    expect(result.messages).toHaveLength(3)
    expect(result.messages[2].content).toBe('🧀')
  })

  await t.step('tool call', async () => {
    resetInstructions(api, 'return the function call results verbatim')
    const content = 'call the "local" function'

    await thread.functions.startThread({ threadPath, agentPath }, api)
    await thread.functions.addMessage({ threadPath, content }, api)
    await completions.functions.complete({ threadPath }, api)

    const result = await api.readJSON<Thread>(threadPath)
    assert('tool_calls' in result.messages[2], 'tool calls missing')
    log('result.messages', result.messages[2].tool_calls)
    assert(result.messages[2].tool_calls)
    expect(result.messages[2].tool_calls).toHaveLength(1)
    const fn = result.messages[2].tool_calls[0]
    expect(fn.function).toEqual({ name: 'local', arguments: '{}' })
  })
  await t.step('tool error', async () => {
    resetInstructions(api, 'return the function call error message')
    const content = 'call the "error" function with message: salami'

    await thread.functions.startThread({ threadPath, agentPath }, api)
    await thread.functions.addMessage({ threadPath, content }, api)
    await completions.functions.complete({ threadPath }, api)

    const result = await api.readJSON<Thread>(threadPath)
    assert('tool_calls' in result.messages[2], 'tool calls missing')
    log('result.messages', result.messages[2].tool_calls)
    assert(result.messages[2].tool_calls)
    expect(result.messages[2].tool_calls).toHaveLength(1)
    const fn = result.messages[2].tool_calls[0]
    expect(fn.function).toEqual({
      name: 'error',
      arguments: '{"message":"salami"}',
    })
  })
  await t.step('double tool call', async () => {
    const agentMd = `
---
commands:
  - io-fixture:ping
---
`

    const content =
      'call the "ping" function twice with the message being the integer "1" for the first one and the integer "2" for the second'
    api.write(agentPath, agentMd)
    api.delete(threadPath)

    await thread.functions.startThread({ threadPath, agentPath }, api)
    await thread.functions.addMessage({ threadPath, content }, api)
    await completions.functions.complete({ threadPath }, api)

    const result = await api.readJSON<Thread>(threadPath)

    log('result.messages', result.messages)
    const [, assistant] = result.messages
    assert('tool_calls' in assistant, 'tool calls missing')
    assert(Array.isArray(assistant.tool_calls), 'tool calls not an array')

    expect(assistant.tool_calls).toHaveLength(2)
    const fn0 = assistant.tool_calls[0]
    const fn1 = assistant.tool_calls[1]
    expect(fn0.function).toEqual({
      name: 'ping',
      arguments: '{"message": "1"}',
    })
    expect(fn1.function).toEqual({
      name: 'ping',
      arguments: '{"message": "2"}',
    })
  })
  db.stop()
})

const resetInstructions = (api: IA, instructions: string) => {
  const split = agentMd.trim().split('\n')
  split.pop()
  split.push(instructions)
  const newInstructions = split.join('\n')
  api.write(agentPath, newInstructions)
  api.delete(threadPath)
}
