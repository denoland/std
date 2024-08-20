import { assert, Debug } from '@utils'
import type OpenAI from 'openai'
import { IA, JSONSchemaType, MetaPromise, Params } from '@/constants.ts'
import { isIsolate } from './index.ts'
import validator from '@io/validator.ts'
const log = Debug('AI:tools:load-tools')

export const loadTools = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result.tools
}
export const loadActions = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result.actions
}
export const loadValidators = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result.validators
}
type Action = (
  params: Params,
  branchName: string,
) => Promise<{ promise: MetaPromise<unknown> }>

const load = async (commands: string[] = [], api: IA) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const actions: Record<string, Action> = {}
  const validators: Record<string, (parameters: Params) => void> = {}

  for (const cmd of commands) {
    const isAgent = !cmd.includes(':')
    if (isAgent) {
      throw new Error('not implemented')
    }
    log('loading command:', cmd)
    const [isolate, functionName] = cmd.split(':')
    assert(isIsolate(isolate), `missing isolate: ${isolate}`)
    const name = isolate + '_' + functionName
    const schema = await api.apiSchema(isolate)
    assert(functionName in schema, `isolate missing command: ${cmd}`)
    const action = async (params: Params, branchName: string) => {
      const actions = await api.actions(isolate, { branchName })
      assert(actions[functionName], `missing action: ${cmd}`)
      // TODO fix this since needs wrapping to get the commit symbol
      // TODO fix ts types so actions always return metapromise types
      const result = actions[functionName](params) as unknown

      const promise: MetaPromise<typeof result> = Promise.resolve(
        result,
      ) as MetaPromise<typeof result>
      return { promise }
    }
    // TODO use the compartment for running these
    validators[name] = validator(schema[functionName], name)
    const tool = isolateToGptApi(name, schema[functionName])

    assert(action, `missing action: ${cmd}`)
    assert(typeof action === 'function', `invalid action: ${action}`)
    assert(!actions[name], `duplicate action: ${cmd}`)
    actions[name] = action
    assert(typeof tool === 'object', `invalid tool: ${tool}`)
    tools.push(tool)
  }

  return { tools, actions, validators }
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
      // slower, but guarantees correct params
      // strict: true,
      parameters,
    },
  }
  return tool
}
