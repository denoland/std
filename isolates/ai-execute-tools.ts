import { assert } from '@std/assert'
import { Debug } from '@utils'
import { serializeError } from 'serialize-error'
import { colorize, IA, print, sha1, Thread, withMeta } from '@/constants.ts'
import { loadActions } from './ai-load-tools.ts'
import * as loadAgent from './load-agent.ts'
import * as files from './files.ts'
const base = 'AI:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

export const executeTools = async (threadPath: string, api: IA) => {
  // TODO only load what the assistant message needs
  log('execute tools:', threadPath)
  let thread = await api.readJSON<Thread>(threadPath)

  const assistant = thread.messages[thread.messages.length - 1]
  assert('tool_calls' in assistant, 'missing tool calls')
  assert(Array.isArray(assistant.tool_calls), 'tool calls must be an array')
  assert(assistant.name, 'missing assistant name')
  log('assistant:', assistant.name)

  const { load } = await api.functions<loadAgent.Api>('load-agent')
  const agent = await load({ path: assistant.name })
  const actions = await loadActions(agent.commands, api)

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
    const branchName = tool_call_id

    try {
      const parameters = JSON.parse(args)
      if (name === 'files_read') {
        const { read } = await api.functions<files.Api>('files')
        message.content = await read(parameters)
        if (parameters.path.endsWith('.json')) {
          // compress down to save tokens
          message.content = JSON.stringify(JSON.parse(message.content))
        }

        log('read', parameters.path, message.content.length, print(api.pid))
      } else {
        const { promise } = await actions[name](parameters, branchName)
        const { result, parent } = await withMeta(promise)
        assert(typeof parent === 'string', 'missing parent')
        assert(sha1.test(parent), 'invalid parent')
        await api.merge(parent)

        thread = await api.readJSON<Thread>(threadPath)
        assert(!thread.toolCommits[tool_call_id], 'tool call already exists')
        thread.toolCommits[tool_call_id] = parent
        api.writeJSON(threadPath, thread)

        log('tool call result:', name, result, colorize(parent))

        if (result === undefined || typeof result === 'string') {
          message.content = result || ''
        } else {
          message.content = JSON.stringify(result, null, 2)
        }
      }
    } catch (error) {
      log('tool call error:', error)
      const serializeable = serializeError(error)
      delete serializeable.stack
      message.content = JSON.stringify(serializeable, null, 2)
    }
    debugToolResult(message.content)
    thread.messages[messageIndex] = message
    api.writeJSON(threadPath, thread)
  }
}
