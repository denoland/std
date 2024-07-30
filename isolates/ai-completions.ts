import { Debug } from '@utils'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import { Agent, Functions, IA, print, Thread } from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
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
    required: ['threadId', 'path'],
    additionalProperties: false,
    properties: { threadId: { type: 'string' }, path: { type: 'string' } },
  },
  once: {
    type: 'object',
    required: ['path', 'content'],
    additionalProperties: false,
    properties: { path: { type: 'string' }, content: { type: 'string' } },
  },
}

export type Api = {
  complete: (params: { threadId: string; path: string }) => Promise<void>
  once: (
    params: { path: string; content: string },
  ) => Promise<OpenAI.ChatCompletionAssistantMessageParam>
}
export const functions: Functions<Api> = {
  async complete({ threadId, path }, api) {
    const threadPath = `threads/${threadId}.json`
    log('completing thread %o', threadId, print(api.pid))
    const thread = await api.readJSON<Thread>(threadPath)
    // TODO assert thread is correctly formatted

    const assistant = await complete(path, thread.messages, api)
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
  async once({ path, content }, api) {
    const result = await complete(path, [{ role: 'user', content }], api)
    return result
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
  const { model, temperature, tool_choice } = config
  const sysprompt: OpenAI.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: agent.instructions,
    name: agent.name,
  }
  const args: OpenAI.ChatCompletionCreateParams = {
    model,
    temperature,
    messages: [...messages, sysprompt].map(safeAssistantName),
    seed: 1337,
    tools,
    tool_choice: tools && tool_choice,
  }

  log('completion started with model: %o', args.model, print(api.pid))
  const completion = await ai.chat.completions.create(args)
  const result = completion.choices[0].message
  log('completion complete', result)
  const assistant: OpenAI.ChatCompletionAssistantMessageParam = {
    ...result,
    name: agent.source.path,
  }
  return assistant
}
const safeAssistantName = (message: Thread['messages'][number]) => {
  if (message.role !== 'assistant') {
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
