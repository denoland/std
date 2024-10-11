import { assert, Debug } from '@utils'
import { loadAgent } from '@/isolates/utils/load-agent.ts'
import type OpenAI from 'openai'
import { zodFunction } from 'openai/helpers/zod'
import {
  Agent,
  getThreadPath,
  type IA,
  Params,
  RpcOpts,
  type Thread,
  withMeta,
} from '@/constants.ts'
import { isIsolate } from '../index.ts'
import * as tps from '@/isolates/tps-report.ts'
import * as napps from '@/isolates/napps.ts'
import type { z } from 'zod'
const log = Debug('AI:tools:load-tools')

export const loadTools = async (agent: Agent, api: IA) => {
  const result = await load(agent, api)
  return result.tools
}
export const loadActions = async (agent: Agent, api: IA) => {
  const result = await load(agent, api)
  return result.actions
}

type PlainAction = (
  params: Params,
) => Promise<unknown>
type SummonAction = (
  params: z.infer<typeof napps.parameters.summon>,
) => Promise<string>
type Action = PlainAction | SummonAction

const load = async (agent: Agent, api: IA) => {
  const tools: OpenAI.ChatCompletionTool[] = []
  const actions: Record<string, Action> = {}

  for (const cmd of agent.commands) {
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

  for (const name of agent.napps) {
    assert(!actions[name], `duplicate action: ${name}`)
    assert(await api.exists('agents/' + name + '.md'), `missing agent: ${name}`)

    const fn: SummonAction = async ({ content, reasoning }) => {
      const opts: RpcOpts = { prefix: 'napp-' + name }
      const { summonByName } = await api.actions<napps.Api>('napps', opts)
      log('summoning napp:', name, content, reasoning)

      const promise = summonByName({ content, reasoning, name })
      const { result, parent } = await withMeta(promise)

      const threadPath = getThreadPath(result)
      const thread = await api.readThread(threadPath, { commit: parent })
      return getLastContent(thread)
    }
    actions[name] = fn

    const agent = await loadAgent('agents/' + name + '.md', api)
    const tool = zodFunction({
      name,
      parameters: napps.parameters.summon,
      description: agent.description,
    })
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
      strict,
      parameters,
    },
  }
  return tool
}

const getLastContent = (thread: Thread): string => {
  const messages = [...thread.messages]
  while (messages.length > 0) {
    const message = messages.pop()
    assert(message, 'message should be defined')
    if (message.role === 'assistant' || message.role === 'tool') {
      assert(typeof message.content === 'string', 'content not string')
      return message.content
    }
  }
  throw new Error('No assistant message found in thread')
}
