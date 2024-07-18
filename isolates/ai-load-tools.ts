import * as loadHelp from './load-agent.ts'
import * as thread from './thread.ts'
import { assert, Debug } from '@utils'
import OpenAI from 'openai'
import {
  Agent,
  generateThreadId,
  getActorId,
  IA,
  JSONSchemaType,
  MetaPromise,
  Params,
} from '@/constants.ts'
const log = Debug('AI:tools:load-tools')

export const loadTools = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result?.tools || undefined
}
export const loadActions = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  assert(result?.actions, 'missing actions')
  return result.actions
}
type Action = (
  params: Params,
  branchName: string,
) => Promise<{ promise: MetaPromise }>

const load = async (commands: string[] = [], api: IA) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const actions: Record<string, Action> = {}
  const actorId = tryGetActorId(api)
  for (const cmd of commands) {
    log('loading command:', cmd)
    let tool: OpenAI.ChatCompletionTool
    let action: Action
    let name: string
    const isAgent = !cmd.includes(':')
    if (isAgent) {
      // TODO cache and parallelize
      const { load } = await api.functions<loadHelp.Api>('load-agent')
      const agent = await load({ path: cmd })
      assert(agent.description, `missing description: ${cmd}`)
      name = agent.name
      const schemas = await api.apiSchema('thread')
      action = async ({ prompt }: Params) => {
        const threadId = generateThreadId(api.commit + prompt)
        // TODO should we be calling backchat to do this job ?
        const { execute } = await api.actions<thread.Api>('thread', {
          branchName: threadId,
          // note noClose is not used ?
        })
        assert(typeof prompt === 'string', `invalid text: ${prompt}`)
        log('agent command:', name, prompt, api.commit)
        const promise = execute({
          threadId,
          agentPath: cmd,
          content: prompt,
          actorId,
        })
        return { promise }
      }
      tool = agentTool(agent, schemas.execute)
    } else {
      const [isolate, functionName] = cmd.split(':')
      name = isolate + '_' + functionName
      const schema = await api.apiSchema(isolate)
      assert(functionName in schema, `isolate missing command: ${cmd}`)
      action = async (params: Params, branchName: string) => {
        const actions = await api.actions(isolate, { branchName })
        assert(actions[functionName], `missing action: ${cmd}`)
        // TODO fix this since needs wrapping to get the commit symbol
        // TODO fix ts types so actions always return metapromise types
        const promise = actions[functionName](params) as MetaPromise
        return { promise }
      }
      tool = isolateToGptApi(name, schema[functionName])
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
const tryGetActorId = (api: IA) => {
  // TODO handle when an origin action has come in, or something remote
  try {
    return getActorId(api.pid)
  } catch (_error) {
    return
  }
}
