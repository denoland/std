import * as loadHelp from '@/isolates/load-help.ts'
import { assert, Debug, posix } from '@utils'
import OpenAI from 'openai'
import { Help, IsolateApi, JSONSchemaType } from '@/constants.ts'
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
const load = async (commands: string[] = [], api: IsolateApi) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const names = new Set()
  const actions: Record<string, (parameters: object) => unknown> = {}
  for (const command of commands) {
    log('loading command:', command)
    let tool: OpenAI.ChatCompletionTool, action, name: string
    if (!command.includes(':')) {
      assert(command.startsWith('helps/'), `invalid help: ${command}`)
      name = posix.basename(command)
      // TODO cache and parallelize
      const { load } = await api.functions<loadHelp.Api>('load-help')
      const help = await load({ help: name })
      assert(help.description, `missing description: ${command}`)
      const schemas = await api.apiSchema('engage-help')
      const { engage } = await api.actions('engage-help')
      action = ({ text }: { text: string }) => {
        log('engage:', name, text, api.commit)
        return engage({ help: name, text }, { branch: true })
      }
      tool = toTool(name, help, schemas.engage)
    } else {
      const [isolate, _name] = command.split(':')
      name = _name
      const isolateApiSchema = await api.apiSchema(isolate)
      const functions = await api.actions(isolate)
      assert(name in functions, `isolate missing command: ${command}`)
      action = functions[name]
      tool = isolateToGptApi(name, isolateApiSchema[name])
    }
    assert(action, `missing action: ${command}`)
    assert(!names.has(name), `duplicate action: ${command}`)
    names.add(name)
    assert(typeof action === 'function', `invalid action: ${action}`)
    actions[name] = action as (parameters: object) => unknown
    assert(typeof tool === 'object', `invalid tool: ${tool}`)
    tools.push(tool)
  }

  if (tools.length) {
    return { tools, actions }
  }
}
const toTool = (name: string, help: Help, schema: JSONSchemaType<object>) => {
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
