import { assert } from '@std/assert'
import { Debug } from '@utils'
import { serializeError } from 'serialize-error'
import { Agent, IA, Thread } from '@/constants.ts'
import { loadActions } from './ai-load-tools.ts'
import { load } from './load-agent.ts'
const base = 'AI:execute-tools'
const log = Debug(base)
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

const loadToolCalls = async (
  threadPath: string,
  api: IA,
  overrides?: Partial<Agent>,
) => {
  const thread = await api.readJSON<Thread>(threadPath)

  const assistant = thread.messages[thread.messages.length - 1]
  assert('tool_calls' in assistant, 'missing tool calls')
  assert(Array.isArray(assistant.tool_calls), 'tool calls must be an array')
  assert(assistant.name, 'missing assistant name')
  const { tool_calls } = assistant

  const agent = await load(assistant.name, api, overrides)
  return { tool_calls, agent, thread }
}

export const executeTools = async (
  threadPath: string,
  api: IA,
  stopOnTools: string[],
  overrides?: Partial<Agent>,
) => {
  const calls = await loadToolCalls(threadPath, api, overrides)
  const { tool_calls, agent } = calls

  const actions = await loadActions(agent, api)
  const logNames = tool_calls.map((call) => call.function.name)
  log('execute tools:', threadPath, logNames)

  // TODO use the new openai runTools helper with a parser
  let isErrored = false
  for (const call of tool_calls) {
    const { function: { name, arguments: args }, id: tool_call_id } = call
    debugToolCall(name, args)
    log('tool call:', name, JSON.parse(args))
    assert(actions[name], `missing action: ${name}`)
    const message: Thread['messages'][number] = {
      role: 'tool',
      tool_call_id,
      content: '',
    }

    if (isErrored) {
      const error = new Error(
        'tool call skipped due to prior error in this batch of parallel tool calls, which are always executed sequentially',
      )
      // TODO validate the params to pass back extra info
      log('tool call error:', error)
      const serializable = serializeError(error)
      delete serializable.stack
      message.content = JSON.stringify(serializable)
    } else {
      try {
        const parameters = JSON.parse(args)
        const result = await actions[name](parameters)

        if (result === undefined || typeof result === 'string') {
          message.content = compressIfPrettyJson(result || '')
        } else {
          message.content = JSON.stringify(result)
        }
        log('tool call result:', name, 'size:', message.content.length)

        if (stopOnTools.includes(name)) {
          if (tool_calls.length !== 1) {
            const msg =
              `Tool ${name} cannot be called in parallel with other tools`
            throw new Error(msg)
          }
        }
      } catch (error) {
        log('tool call error:', error)
        isErrored = true
        const serializable = serializeError(error)
        delete serializable.stack
        message.content = JSON.stringify(serializable)
      }
    }
    debugToolResult(message.content)

    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push(message)
    thread.toolCommits[tool_call_id] = api.commit
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
