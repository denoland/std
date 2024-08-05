import { assert, Debug } from '@utils'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import {
  actorIdRegex,
  Agent,
  Functions,
  getBaseName,
  IA,
  Params,
  print,
  Thread,
} from '@/constants.ts'
import { loadTools, loadValidators } from './ai-load-tools.ts'
import * as loadAgent from './load-agent.ts'
const log = Debug('AI:completions')

const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const ai = new OpenAI({ apiKey, timeout: 20 * 1000, maxRetries: 5 })

export const transcribe = async (file: File) => {
  const transcription = await ai.audio.transcriptions
    .create({
      file,
      model: 'whisper-1',
      prompt:
        'Backchat, GPT4, GPT3, Dreamcatcher, CRM, HAL, Deno, Stucks, Redlid',
    })
  return transcription.text
}

export const api = {
  complete: {
    type: 'object',
    required: ['path'],
    additionalProperties: false,
    properties: { path: { type: 'string' } },
  },
  once: {
    type: 'object',
    required: ['path', 'content', 'actorId'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      actorId: { type: 'string', pattern: actorIdRegex.source },
    },
  },
  halt: {
    type: 'object',
    required: ['content', 'path'],
    additionalProperties: false,
    properties: { content: { type: 'string' }, path: { type: 'string' } },
  },
  oneshot: {
    type: 'object',
    required: ['path', 'contents', 'actorId'],
    additionalProperties: false,
    properties: {
      path: { type: 'string' },
      contents: { type: 'array', items: { type: 'string' } },
      actorId: { type: 'string', pattern: actorIdRegex.source },
    },
  },
}

export type Api = {
  complete: (params: { path: string }) => Promise<void>
  once: (
    params: {
      path: string
      content: string
      actorId: string
    },
  ) => Promise<OpenAI.ChatCompletionAssistantMessageParam>
  halt: (
    params: { content: string; path: string },
  ) => Promise<Params>
  oneshot: (
    params: { path: string; contents: string[]; actorId: string },
  ) => Promise<OpenAI.ChatCompletionAssistantMessageParam>
}
export const functions: Functions<Api> = {
  async complete({ path }, api) {
    const threadId = getBaseName(api.pid)
    const threadPath = `threads/${threadId}.json`
    log('completing thread %o', threadId, print(api.pid))
    const thread = await api.readJSON<Thread>(threadPath)
    // TODO assert thread is correctly formatted

    const assistant = await complete(path, thread.messages, api)
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
  async once({ path, content, actorId }, api) {
    const threadId = getBaseName(api.pid)
    const threadPath = `threads/${threadId}.json`
    log('once %o', threadId, print(api.pid))
    const thread = await api.readJSON<Thread>(threadPath)
    const message: Thread['messages'][number] = {
      role: 'user',
      content,
      name: actorId,
    }
    const messages = [...thread.messages, message]
    // TODO verify the agent is restricted to a single function call
    const result = await complete(path, messages, api)
    return result
  },
  async halt({ content, path }, api) {
    const threadId = getBaseName(api.pid)
    const threadPath = `threads/${threadId}.json`
    log('halt %o', threadId, content, path, print(api.pid))
    const thread = await api.readJSON<Thread>(threadPath)
    const assistant = await complete(path, thread.messages, api)

    assert(assistant.tool_calls, 'tool_calls missing from halt call')
    assert(assistant.tool_calls.length === 1, 'tool_calls length is not 1')
    const result = assistant.tool_calls[0]
    log('result', result)

    const { load } = await api.functions<loadAgent.Api>('load-agent')
    const agent = await load({ path })
    const validators = await loadValidators(agent.commands, api)

    const { name } = result.function
    assert(validators[name], 'validator not found: ' + name)
    const parsed = JSON.parse(result.function.arguments)
    validators[name](parsed)

    log('halt complete', name, parsed)
    return parsed
  },
  async oneshot({ path, contents, actorId }, api) {
    log('oneshot %o', path, actorId, print(api.pid))
    const messages: Thread['messages'] = contents.map((content) => ({
      role: 'user',
      content,
      name: actorId,
    }))
    const assistant = await complete(path, messages, api)
    return assistant
  },
}

const complete = async (
  path: string,
  messages: Thread['messages'],
  api: IA,
) => {
  const { load } = await api.functions<loadAgent.Api>('load-agent')
  const agent: Agent = await load({ path })
  const tools = await loadTools(agent.commands, api)
  const { config } = agent
  const {
    model,
    temperature,
    tool_choice,
    parallel_tool_calls,
    presence_penalty,
  } = config
  const sysprompt: OpenAI.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: agent.instructions,
    name: agent.source.path,
  }
  const args: OpenAI.ChatCompletionCreateParams = {
    model,
    temperature,
    messages: [...messages, sysprompt].map(safeAssistantName),
    seed: 1337,
    tools: tools.length ? tools : undefined,
    tool_choice: tools.length ? tool_choice : undefined,
    presence_penalty,
    parallel_tool_calls: tools.length ? parallel_tool_calls : undefined,
  }

  log('completion started with model: %o', args.model, print(api.pid))
  let completion
  try {
    completion = await ai.chat.completions.create(args)
  } catch (error) {
    console.error('ai completion error', error)
    throw error
  }
  const result = completion.choices[0].message
  log('completion complete', agent.source.path, result)
  const assistant: OpenAI.ChatCompletionAssistantMessageParam = {
    ...result,
    name: agent.source.path,
  }
  return assistant
}
const safeAssistantName = (message: Thread['messages'][number]) => {
  if (message.role !== 'assistant' && message.role !== 'system') {
    return message
  }
  if (!message.name) {
    return message
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(message.name)) {
    return { ...message, name: message.name.replaceAll(/[^a-zA-Z0-9_-]/g, '_') }
  }
  return message
}
