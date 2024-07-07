import * as loadHelp from '@/isolates/load-help.ts'
import * as engage from '@/isolates/engage-help.ts'
import { assert, Debug, posix } from '@utils'
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
    const isHelp = !cmd.includes(':')
    if (isHelp) {
      assert(cmd.startsWith('helps/'), `invalid help: ${cmd}`)
      name = posix.basename(cmd)
      // TODO cache and parallelize
      const { load } = await api.functions<loadHelp.Api>('load-help')
      const help = await load({ help: name })
      assert(help.description, `missing description: ${cmd}`)
      const schemas = await api.apiSchema('engage-help')
      const { engageNew } = await api.actions<engage.Api>('engage-help')
      action = ({ text }: Params, branchName: string) => {
        log('help command:', name, text, api.commit)
        assert(typeof text === 'string', `invalid text: ${text}`)
        return engageNew({ help: name, text }, { branchName })
      }
      tool = helpTool(name, help, schemas.engage)
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
const helpTool = (
  name: string,
  help: Agent,
  schema: JSONSchemaType<object>,
) => {
  const parameters = {
    type: 'object',
    additionalProperties: false,
    required: ['text'],
    properties: {
      text: schema.properties.text,
    },
  }

  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name,
      description: help.description,
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
