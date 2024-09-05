import { Debug } from '@utils'
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
  toApi,
  ToApiType,
} from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
import { load } from './utils/load-agent.ts'
import { z } from 'zod'

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

export const parameters = {
  complete: z.object({ path: z.string() }),
}
export const returns = {
  complete: z.void(),
}

export const api = toApi(parameters)

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  async complete({ path }, api) {
    const threadPath = getThreadPath(api.pid)
    log('completing thread %o', threadPath, print(api.pid))
    const thread = await api.readThread(threadPath)

    const assistant = await complete(path, thread.messages, api)
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
}

const complete = async (
  path: string,
  messages: Thread['messages'],
  api: IA,
) => {
  const agent: Agent = await load(path, api)
  const tools = await loadTools(agent.commands, api)

  const args = getChatParams(agent, messages, tools)

  log('completion started with model: %o', args.model, print(api.pid))
  let retries = 0
  const RETRY_LIMIT = 5
  let errorMessage = ''
  while (retries++ < RETRY_LIMIT) {
    try {
      const completion = await ai.chat.completions.create(args)
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
  const sysprompt: CompletionMessage = {
    role: 'system',
    content: agent.instructions + '\n\n' + additionInstructions(),
    name: agent.source.path,
  }
  const args: ChatParams = {
    model,
    temperature,
    messages: [...messages, sysprompt].map(safeAssistantName),
    seed: 1337,
    tools: tools.length ? tools : undefined,
    tool_choice: tools.length ? tool_choice : undefined,
    presence_penalty,
    parallel_tool_calls: tools.length ? parallel_tool_calls : undefined,
  }
  return args
}
const safeAssistantName = (message: CompletionMessage) => {
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
