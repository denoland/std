import * as loadHelp from './load-agent.ts'
import * as thread from './thread.ts'
import { assert, Debug } from '@utils'
import OpenAI from 'openai'
import { Agent, IsolateApi, JSONSchemaType, Params } from '@/constants.ts'
const log = Debug('AI:tools:load-tools')

export const loadTools = async (commands: string[] = [], api: IsolateApi) => {
  const result = await load(commands, api)
  return result?.tools || undefined
}
export const loadActions = async (commands: string[] = [], api: IsolateApi) => {
  const result = await load(commands, api)
  assert(result?.actions, 'missing actions')
  return result.actions
}
type Action = (params: Params, branchName: string) => Promise<unknown>

const load = async (commands: string[] = [], api: IsolateApi) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const actions: Record<string, Action> = {}
  for (const cmd of commands) {
    log('loading command:', cmd)
    let tool: OpenAI.ChatCompletionTool
    let action: (params: Params, branchName: string) => Promise<unknown>
    let name: string
    const isAgent = !cmd.includes(':')
    if (isAgent) {
      // TODO cache and parallelize
      const { load } = await api.functions<loadHelp.Api>('load-agent')
      const agent = await load({ path: cmd })
      assert(agent.description, `missing description: ${cmd}`)
      name = agent.name
      const schemas = await api.apiSchema('thread')
      action = async ({ prompt }: Params, toolCallId: string) => {
        const threadId = `thr_${toolCallId}`
        const { execute } = await api.actions<thread.Api>('thread', {
          branchName: threadId,
        })
        assert(typeof prompt === 'string', `invalid text: ${prompt}`)
        log('agent command:', name, prompt, api.commit)
        return execute({
          threadId,
          agentPath: cmd,
          content: prompt,
          userId: '',
        })
      }
      tool = agentTool(agent, schemas.execute)
    } else {
      const [isolate, _name] = cmd.split(':')
      name = _name
      const isolateApiSchema = await api.apiSchema(isolate)
      const _actions = await api.actions(isolate)
      assert(name in _actions, `isolate missing command: ${cmd}`)
      action = (params: Params, branchName: string) => {
        return Promise.resolve(_actions[name](params, { branchName }))
      }
      tool = isolateToGptApi(name, isolateApiSchema[name])
    }
    assert(action, `missing action: ${cmd}`)
    assert(typeof action === 'function', `invalid action: ${action}`)
    assert(!actions[name], `duplicate action: ${cmd}`)
    actions[name] = action
    assert(typeof tool === 'object', `invalid tool: ${tool}`)
    tools.push(tool)
  }

  if (tools.length) {
    return { tools, actions }
  }
}
const agentTool = (
  agent: Agent,
  schema: JSONSchemaType<object>,
) => {
  const parameters = {
    type: 'object',
    additionalProperties: false,
    required: ['prompt'],
    properties: {
      prompt: schema.properties.prompt,
    },
  }

  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name: agent.name,
      description: agent.description,
      parameters,
    },
  }
  return tool
}
const isolateToGptApi = (name: string, schema: JSONSchemaType<object>) => {
  assert(typeof schema === 'object', `api must be an object: ${name}`)
  assert(typeof schema.type === 'string', `api.type must be a string: ${name}`)
  const parameters: Record<string, unknown> = { ...schema }
  delete parameters.title
  delete parameters.description
  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name,
      description: schema.description,
      parameters,
    },
  }
  return tool
}
