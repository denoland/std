import { expect, log } from '@utils'
import { getThreadPath } from '../constants.ts'
import * as longthread from './longthread.ts'
import { Backchat } from '../api/client-backchat.ts'
import { assert } from '@std/assert'
import { cradleMaker } from '@/cradle-maker.ts'

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
const errorSwitchboard = `
---
commands:
  - agents:switch
---
call the "agents_switch" function with the argument "agents/missing.md".  If this fails for any reason, stop immediately and reply with: "cincinnati".
`
const path = 'agents/agent-fixture.md'

Deno.test('longthread chat', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { backchat } = cradle

  const actorId = 'longthread'

  const longthread = await backchat.actions<longthread.Api>('longthread')

  await t.step('create longthread', async () => {
    await backchat.write(path, agentMd)
    await longthread.start({})
  })
  await t.step('start twice errors', async () => {
    await expect(longthread.start({})).rejects.toThrow('thread exists')
  })

  await t.step('hello world', async () => {
    const content = 'cheese emoji'
    await longthread.run({ path, content, actorId })
    const result = await backchat.readThread(backchat.pid)
    log('result', result)
    expect(result.messages).toHaveLength(2)
    expect(result.messages[1].content).toBe('🧀')
  })

  await t.step('tool call', async () => {
    resetInstructions(backchat, 'return the function call results')
    const content = 'call the "local" function'

    await longthread.run({ path, content, actorId })

    const result = await backchat.readThread(backchat.pid)
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

    await longthread.run({ path, content, actorId })

    const result = await backchat.readThread(backchat.pid)

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
      .toBe('{"name":"Error","message":"salami"}')
  })
  await t.step('double tool call', async () => {
    const content =
      'call the "ping" function twice with the message being the integer "1" for the first one and the integer "2" for the second'
    backchat.write(path, doubleToolCall)

    await longthread.run({ path, content, actorId })
    const result = await backchat.readThread(backchat.pid)

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
})

Deno.test('test o1 agents', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { backchat } = cradle
  const actorId = 'agents_o1_family'

  const longthread = await backchat.actions<longthread.Api>('longthread')
  const o1Path = 'agents/o1.md'
  const o1 = Deno.readTextFileSync('./HAL/' + o1Path)
  const o1MiniPath = 'agents/o1-mini.md'
  const o1Mini = Deno.readTextFileSync('./HAL/' + o1MiniPath)

  await backchat.write(o1Path, o1)
  await backchat.write(o1MiniPath, o1Mini)

  await t.step('ask o1', async () => {
    await longthread.start({})
    const content = 'whats in a name ?'
    await longthread.run({ path: o1Path, content, actorId })

    const thread = await backchat.readThread(backchat.pid)
    const assistant = thread.messages.pop()
    assert(assistant)
    expect(assistant.content).toContain('Shakespeare')
  })

  await t.step('ask o1-mini', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})
    const content = 'whats in a name ?'
    await longthread.run({ path: o1Path, content, actorId })

    const thread = await backchat.readThread(backchat.pid)
    const assistant = thread.messages.pop()
    assert(assistant)
    expect(assistant.content).toContain('Shakespeare')
  })
  await t.step('o1-mini with prior tool calls', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})
    let path = 'agents/files.md'
    let content = 'read the file "agents/creatorBot.md"'
    await longthread.run({ path, content, actorId })

    path = 'agents/o1-mini.md'
    content = 'how could this system prompt be improved ?'
    await longthread.run({ path, content, actorId })

    const thread = await backchat.readThread(backchat.pid)
    const assistant = thread.messages.pop()
    assert(typeof assistant?.content === 'string', 'no assistant')
    expect(assistant.content.toLowerCase()).toContain('creatorbot')
  })
})

Deno.test('switchboard errors', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { backchat } = cradle
  const actorId = 'switchboard_errors'
  const path = 'agents/switchboard.md'

  const longthread = await backchat.actions<longthread.Api>('longthread')
  await backchat.write(
    path,
    errorSwitchboard,
  )
  await t.step('missing agent', async () => {
    await longthread.start({})
    await longthread.run({ path, content: 'hello', actorId })
    const thread = await backchat.readThread(backchat.pid)
    const assistant = thread.messages.pop()
    assert(typeof assistant?.content === 'string', 'no assistant')
    expect(assistant.content).toBe('cincinnati')
  })
})

Deno.test('router', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { backchat } = cradle
  const actorId = 'test-router'

  const router = Deno.readTextFileSync('./HAL/agents/router.md')
  await backchat.write('agents/router.md', router)

  const longthread = await backchat.actions<longthread.Api>('longthread')
  await t.step('default agent', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})
    await longthread.route({ content: 'hello', actorId })

    const thread = await backchat.readThread(backchat.pid)
    const assistant = thread.messages.pop()
    assert(assistant?.role === 'assistant', 'no assistant')
    expect(assistant?.name).toBe(thread.agent)
  })
  await t.step('swallow prompt', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})
    await longthread.route({ content: '/o1', actorId })

    const thread = await backchat.readThread(backchat.pid)

    expect(thread.agent).toBe('agents/o1.md')

    const tool = thread.messages.pop()
    expect(tool?.role).toBe('tool')
    expect(tool?.content).toBe('null')

    const assistant = thread.messages.pop()
    assert(assistant?.role === 'assistant', 'no assistant')
    expect(assistant?.name).toBe('agents/router.md')

    const toolCall = assistant?.tool_calls?.[0]
    assert(toolCall, 'missing tool call')
    const args = JSON.parse(toolCall.function.arguments)
    expect(args.path).toBe('agents/o1.md')
    expect(args.swallowPrompt).toBeTruthy()
  })
  await t.step('rewritten prompt', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})
    await longthread.route({ content: '/o1-mini hello', actorId })

    const thread = await backchat.readThread(backchat.pid)
    expect(thread.agent).toBe('agents/o1-mini.md')
  })
})

Deno.test('agents_switch function acts as router', async (t) => {
  await using cradle = await cradleMaker(t, import.meta.url)
  const { backchat } = cradle
  const actorId = 'test-agents_switch'

  const router = Deno.readTextFileSync('./HAL/agents/router.md')
  await backchat.write('agents/router.md', router)
  const switchboard = Deno.readTextFileSync('./HAL/agents/switchboard.md')
  await backchat.write('agents/switchboard.md', switchboard)

  const longthread = await backchat.actions<longthread.Api>('longthread')
  const path = 'agents/switchboard.md'

  await t.step('switchboard to files with no prompt', async () => {
    await longthread.start({})
    await longthread.run({ path, content: 'switch to files', actorId })

    const thread = await backchat.readThread(backchat.pid)

    expect(thread.agent).toBe('agents/files.md')

    const tool = thread.messages.pop()
    expect(tool?.role).toBe('tool')
    expect(tool?.content).toBe('null')

    const assistant = thread.messages.pop()
    assert(assistant?.role === 'assistant', 'no assistant')
    expect(assistant?.name).toBe(path)

    const toolCall = assistant?.tool_calls?.[0]
    assert(toolCall, 'missing tool call')
    const args = JSON.parse(toolCall.function.arguments)
    expect(args.path).toBe('agents/files.md')
    expect(args.swallowPrompt).toBeTruthy()
  })
  await t.step('switchboard with prompt', async () => {
    await backchat.delete(getThreadPath(backchat.pid))
    await longthread.start({})

    await longthread.run({ path, content: 'list all my files', actorId })

    const thread = await backchat.readThread(backchat.pid)

    expect(thread.agent).toBe('agents/files.md')

    const assistant = thread.messages.pop()
    assert(assistant, 'no assistant')
    assert(assistant.role === 'assistant', 'no assistant')
    expect(assistant.name).toBe('agents/files.md')
    expect(assistant.content).toBeTruthy()
    expect(assistant.tool_calls).toBeUndefined()
  })
})

const resetInstructions = (backchat: Backchat, instructions: string) => {
  const split = agentMd.trim().split('\n')
  split.pop()
  split.push(instructions)
  const newInstructions = split.join('\n')
  backchat.write(path, newInstructions)
}
