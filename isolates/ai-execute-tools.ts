import { assert } from '@std/assert'
import { Debug } from '@utils'
import { serializeError } from 'serialize-error'
import { IA, Thread } from '@/constants.ts'
import { loadActions } from './ai-load-tools.ts'
import * as loadAgent from './load-agent.ts'
const base = 'AI:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

export const executeTools = async (threadPath: string, api: IA) => {
  // TODO only load what the assistant message needs
  const thread = await api.readJSON<Thread>(threadPath)

  const assistant = thread.messages[thread.messages.length - 1]
  assert('tool_calls' in assistant, 'missing tool calls')
  assert(Array.isArray(assistant.tool_calls), 'tool calls must be an array')
  assert(assistant.name, 'missing assistant name')

  const { load } = await api.functions<loadAgent.Api>('load-agent')
  const agent = await load({ path: assistant.name })
  const actions = await loadActions(agent.commands, api)

  const logNames = assistant.tool_calls.map((call) => call.function.name)
  log('execute tools:', threadPath, logNames)

  // TODO use the new openai runTools helper with a parser
  for (const call of assistant.tool_calls) {
    const { function: { name, arguments: args }, id: tool_call_id } = call
    debugToolCall(name, args)
    log('tool call:', name, JSON.parse(args))
    assert(actions[name], `missing action: ${name}`)
    const message: Thread['messages'][number] = {
      role: 'tool',
      tool_call_id,
      content: '',
    }
    const messageIndex = thread.messages.length
    thread.messages.push(message)
    api.writeJSON(threadPath, thread)

    try {
      const parameters = JSON.parse(args)
      const result = await actions[name](parameters)

      if (result === undefined || typeof result === 'string') {
        message.content = compressIfPrettyJson(result || '')
      } else {
        message.content = JSON.stringify(result)
      }
      log('tool call result:', name, 'size:', message.content.length)
    } catch (error) {
      log('tool call error:', error)
      const serializeable = serializeError(error)
      delete serializeable.stack
      message.content = JSON.stringify(serializeable)
    }
    debugToolResult(message.content)
    thread.messages[messageIndex] = message
    api.writeJSON(threadPath, thread)
  }
  log('done')
}

const compressIfPrettyJson = (content: string) => {
  try {
    const json = JSON.parse(content)
    return JSON.stringify(json)
  } catch {
    return content
  }
}
