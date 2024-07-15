import { assert } from '@std/assert'
import { Debug } from '@utils'
import OpenAI from 'openai'
import { serializeError } from 'serialize-error'
import { colorize, IsolateApi, sha1, Thread, withMeta } from '@/constants.ts'
import { loadActions } from './ai-load-tools.ts'
const base = 'AI:tools:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

export const executeTools = async (threadPath: string, api: IsolateApi) => {
  // TODO only load what the assistant message needs

  let thread = await api.readJSON<Thread>(threadPath)
  const actions = await loadActions(thread.agent.commands, api)

  const assistant = thread.messages[thread.messages.length - 1]
  assert('tool_calls' in assistant, 'missing tool calls')
  assert(Array.isArray(assistant.tool_calls), 'tool calls must be an array')

  // TODO use the new openai runTools helper with a parser
  for (const call of assistant.tool_calls) {
    const { function: { name, arguments: args }, id: tool_call_id } = call
    debugToolCall(name, args)
    log('tool call:', name, args)
    assert(actions[name], `missing action: ${name}`)
    const message: OpenAI.ChatCompletionToolMessageParam = {
      role: 'tool',
      tool_call_id,
      content: '',
    }
    const messageIndex = thread.messages.length
    thread.messages.push(message)
    api.writeJSON(threadPath, thread)

    try {
      const parameters = JSON.parse(args)
      log('executing tool call:', colorize(api.commit), name, parameters)
      const branchName = tool_call_id
      const promise = actions[name](parameters, branchName)
      const { result, parent } = await withMeta(promise)
      assert(typeof parent === 'string', 'missing parent')
      assert(sha1.test(parent), 'invalid parent')
      await api.merge(parent)
      thread = await api.readJSON<Thread>(threadPath)
      assert(!thread.toolCommits[tool_call_id], 'tool call already exists')
      thread.toolCommits[tool_call_id] = parent
      api.writeJSON(threadPath, thread)

      log('tool call result:', name, result, colorize(parent))
      if (result === '@@ARTIFACT_RELAY@@') {
        log('tool call relay')

        const withoutTip = thread.messages.slice(0, -1)
        const lastToolCall = withoutTip
          .findLast(({ role }) => role === 'tool')
        assert(lastToolCall, 'missing last tool call')
        message.content = (lastToolCall.content || '') as string
        thread.messages[messageIndex] = message
        api.writeJSON(threadPath, thread)

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
    thread.messages[messageIndex] = message
    api.writeJSON(threadPath, thread)
  }
}
