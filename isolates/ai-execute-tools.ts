import { assert } from '@std/assert'
import { Debug } from '@utils'
import OpenAI from 'openai'
import { serializeError } from 'serialize-error'
import { Help, IsolateApi } from '@/constants.ts'
import { SESSION_PATH } from './ai-completions.ts'
import { loadActions } from './ai-load-tools.ts'
const base = 'AI:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

type MessageParam = OpenAI.ChatCompletionMessageParam

export const executeTools = async (help: Help, api: IsolateApi) => {
  // TODO only load what the assistant message needs
  const [messages, actions] = await Promise.all([
    api.readJSON<MessageParam[]>(SESSION_PATH),
    loadActions(help.commands, api),
  ])

  const assistant = messages[messages.length - 1]
  assert('tool_calls' in assistant, 'missing tool calls')
  assert(Array.isArray(assistant.tool_calls), 'tool calls must be an array')

  // TODO use the new openai runTools helper with a parser
  for (const call of assistant.tool_calls) {
    const {
      function: { name, arguments: args },
      id: tool_call_id,
    } = call
    debugToolCall(name, args)
    log('tool call:', name, args)
    assert(actions[name], `missing action: ${name}`)
    const message: OpenAI.ChatCompletionToolMessageParam = {
      role: 'tool',
      tool_call_id,
      content: '',
    }
    messages.push(message)
    api.writeJSON(SESSION_PATH, messages)

    try {
      const parameters = JSON.parse(args)
      log('executing tool call at commit:', api.commit, name, parameters)
      const result = await actions[name](parameters)
      log('tool call result:', result)
      if (result === '@@ARTIFACT_RELAY@@') {
        log('tool call relay')

        const withoutTip = messages.slice(0, -1)
        const lastToolCall = withoutTip
          .reverse()
          .findLast(({ role }) => role === 'tool')
        assert(lastToolCall, 'missing last tool call')
        message.content = (lastToolCall.content || '') as string
        api.writeJSON(SESSION_PATH, messages)

        return message.content
      }

      if (result === undefined || typeof result === 'string') {
        message.content = result || ''
      } else {
        message.content = JSON.stringify(result, null, 2)
      }
    } catch (error) {
      log('tool call error:', error)
      message.content = JSON.stringify(serializeError(error), null, 2)
    }
    debugToolResult(message.content)
  }

  api.writeJSON(SESSION_PATH, messages)
}
