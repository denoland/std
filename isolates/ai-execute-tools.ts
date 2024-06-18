import { assert } from '@std/assert'
import { Debug } from '@utils'
import OpenAI from 'openai'
import { serializeError } from 'serialize-error'
import { colorize, Help, IsolateApi, withMeta } from '@/constants.ts'
import { loadActions } from './ai-load-tools.ts'
import {
  readSession,
  writeSession,
  writeToolCommit,
} from '@/isolates/ai-session-utils.ts'
const base = 'AI:tools:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

export const executeTools = async (help: Help, api: IsolateApi) => {
  // TODO only load what the assistant message needs
  const actions = await loadActions(help.commands, api)
  let session = await readSession(api)
  const assistant = session[session.length - 1]
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
    const messageIndex = session.length
    session.push(message)
    writeSession(session, api)

    try {
      const parameters = JSON.parse(args)
      log('executing tool call:', colorize(api.commit), name, parameters)
      const branchName = tool_call_id
      const promise = actions[name](parameters, branchName)
      const { result, parent } = await withMeta(promise)
      assert(typeof parent === 'string', 'missing parent')
      await writeToolCommit(tool_call_id, parent, api)

      log('tool call result:', name, result, colorize(parent))
      // TODO why would this have changed due to an action running ?
      session = await readSession(api)
      if (result === '@@ARTIFACT_RELAY@@') {
        log('tool call relay')

        const withoutTip = session.slice(0, -1)
        const lastToolCall = withoutTip
          .findLast(({ role }) => role === 'tool')
        assert(lastToolCall, 'missing last tool call')
        message.content = (lastToolCall.content || '') as string
        session[messageIndex] = message
        writeSession(session, api)

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
    session[messageIndex] = message
    writeSession(session, api)
  }
}
