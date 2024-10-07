import { assert, Debug } from '@utils'
import type OpenAI from 'openai'
import { zodFunction } from 'openai/helpers/zod'
import { IA, Params } from '@/constants.ts'
import { isIsolate } from '../index.ts'
import * as tps from '@/isolates/tps-report.ts'
const log = Debug('AI:tools:load-tools')

export const loadTools = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result.tools
}
export const loadActions = async (commands: string[] = [], api: IA) => {
  const result = await load(commands, api)
  return result.actions
}
type Action = (
  params: Params,
) => Promise<unknown>

export const load = async (commands: string[] = [], api: IA) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const actions: Record<string, Action> = {}

  for (const cmd of commands) {
    if (!cmd.includes(':')) {
      throw new Error('Invalid command: ' + cmd)
    }
    log('loading command:', cmd)
    const [isolate, functionName] = cmd.split(':')
    assert(isIsolate(isolate), `missing isolate: ${isolate}`)
    const name = isolate + '_' + functionName
    const schema = await api.apiSchema(isolate)
    assert(functionName in schema, `isolate missing command: ${cmd}`)
    const action = async (params: Params) => {
      const actions = await api.actions(isolate)
      assert(actions[functionName], `missing action: ${cmd}`)
      return actions[functionName](params)
    }
    const tool = isolateToGptApi(name, schema[functionName])

    assert(action, `missing action: ${cmd}`)
    assert(typeof action === 'function', `invalid action: ${action}`)
    assert(!actions[name], `duplicate action: ${cmd}`)
    actions[name] = action
    assert(typeof tool === 'object', `invalid tool: ${tool}`)
    tools.push(tool)
  }

  return { tools, actions }
}
const isolateToGptApi = (name: string, schema: object) => {
  assert(typeof schema === 'object', `api must be an object: ${name}`)
  assert('type' in schema, `api must have a type: ${name}`)
  assert(typeof schema.type === 'string', `api.type must be a string: ${name}`)
  assert('description' in schema, `api must have a description: ${name}`)
  assert(typeof schema.description === 'string', `api.description not string`)

  const parameters: Record<string, unknown> = { ...schema }
  delete parameters.title
  delete parameters.description
  const strict = name === 'tps-report_upsert' ? true : false

  if (name === 'tps-report_upsert') {
    const result = zodFunction({
      name: 'tps-report_upsert',
      parameters: tps.parameters.upsert,
    })
    return result
  }

  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name,
      description: schema.description,
      // slower, but guarantees correct params
      strict,
      parameters,
    },
  }
  return tool
}
