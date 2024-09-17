import { assert, Debug } from '@utils'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import {
  Agent,
  AssistantMessage,
  ChatParams,
  CompletionMessage,
  Functions,
  getThreadPath,
  IA,
  print,
  Thread,
  ToApiType,
} from '@/constants.ts'
import { loadTools } from './utils/ai-load-tools.ts'
import { load } from './utils/load-agent.ts'
import { z } from 'zod'

const log = Debug('AI:completions')

const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const ai = new OpenAI({ apiKey, maxRetries: 5 })

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

export const parameters = {
  complete: z.object({ path: z.string() }),
  /** Gives slightly quicker feedback to users when waiting for completions */
  effect: z.object({ path: z.string() }),
}
export const returns = {
  complete: z.void(),
  effect: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  async complete({ path }, api) {
    const threadPath = getThreadPath(api.pid)
    log('completing thread %o', threadPath, print(api.pid))

    const agent = await load(path, api)
    const thread = await api.readThread(threadPath)
    thread.messages.push({ role: 'assistant', name: agent.source.path })
    api.writeJSON(threadPath, thread)

    const { effect } = await api.actions<Api>('ai-completions')
    await effect({ path })
  },
  async effect({ path }, api) {
    const threadPath = getThreadPath(api.pid)
    log('completing thread %o', threadPath, print(api.pid))

    const agent = await load(path, api)
    const thread = await api.readThread(threadPath)
    const last = thread.messages.pop()
    assert(last, 'no messages in thread')
    assert(last.role === 'assistant', 'last message must be assistant')
    assert(last.name === agent.source.path, 'last message must be from agent')
    assert(!last.content, 'last message must be empty')

    const assistant = await complete(agent, thread.messages, api)

    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
}

const complete = async (
  agent: Agent,
  messages: Thread['messages'],
  api: IA,
) => {
  const tools = await loadTools(agent.commands, api)
  const args = getChatParams(agent, messages, tools)

  log('completion started with model: %o', args.model, print(api.pid))
  let retries = 0
  const RETRY_LIMIT = 5
  let errorMessage = ''
  while (retries++ < RETRY_LIMIT) {
    try {
      const { data: completion, response: raw } = await ai.chat.completions
        .create(args).withResponse()
      log('headers', raw)
      const result = completion.choices[0].message
      log('completion complete', agent.source.path, result)
      const assistant: AssistantMessage = {
        ...result,
        name: agent.source.path,
      }
      return assistant
    } catch (error) {
      console.error('ai completion error', error)
      errorMessage = error.message
    }
  }
  throw new Error(`Failed after ${retries} attempts: ${errorMessage}`)
}

export const getChatParams = (
  agent: Agent,
  messages: Thread['messages'],
  tools: OpenAI.ChatCompletionTool[],
) => {
  const { config } = agent
  const {
    model,
    temperature,
    tool_choice,
    parallel_tool_calls,
    presence_penalty,
  } = config

  messages = [...messages]
  const sysprompt: CompletionMessage = {
    role: 'system',
    content: agent.instructions + '\n\n' + additionInstructions(),
    name: agent.source.path,
  }
  if (agent.instructions || agent.commands.length) {
    messages.push(sysprompt)
  }
  messages = messages.map(safeAssistantName)

  const args: ChatParams = {
    model,
    temperature,
    messages,
    seed: 1337,
    tools: tools.length ? tools : undefined,
    tool_choice: tools.length ? tool_choice : undefined,
    presence_penalty,
    parallel_tool_calls: tools.length ? parallel_tool_calls : undefined,
  }
  return args
}
export const safeAssistantName = (message: CompletionMessage) => {
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

const additionInstructions = () => {
  return 'The time is: ' + new Date().toISOString()
}
