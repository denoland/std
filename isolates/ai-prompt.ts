import { assert } from '@std/assert'
import { executeTools } from './ai-execute-tools.ts'
import { Debug, equal } from '@utils'
import OpenAI from 'openai'
import '@std/dotenv/load'
import { Help, IsolateApi } from '@/constants.ts'
import { Api, SESSION_PATH } from './ai-completions.ts'

type MessageParam = OpenAI.ChatCompletionMessageParam
const base = 'AI:prompt'
const log = Debug(base)
const debugResult = Debug(base + ':ai-result-content')

type Args = { text: string; help: Help }

export const api = {
  prompt: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      help: { type: 'object' },
    },
    required: ['text', 'help'],
    additionalProperties: false,
  },
}

export const functions = {
  prompt: async ({ help, text }: Args, api: IsolateApi) => {
    await prepare(help, text, api)
    const { create } = await api.actions<Api>('ai-completions')
    do {
      await create(help)
      if (await isDone(api)) {
        return
      }
      await executeTools(help, api)
    } while (!(await isDone(api)))
  },
}

export const prepare = async (help: Help, text: string, api: IsolateApi) => {
  assert(text.length, 'text must not be empty')
  let messages: MessageParam[] = []
  let existing: MessageParam[] | undefined
  if (await api.exists(SESSION_PATH)) {
    log('session exists')
    messages = await api.readJSON<MessageParam[]>(SESSION_PATH)
    existing = [...messages]
    assert(Array.isArray(messages), 'messages must be an array')
  }

  const content = help.instructions
  if (content) {
    log('sysprompt:', content)
    if (!equal(messages[0], { role: 'system', content })) {
      if (messages[0]?.role === 'system') {
        messages.shift()
      }
      messages.unshift({ role: 'system', content })
    }
  }
  if (text) {
    messages.push({ role: 'user', content: text })
  }
  if (!equal(existing, messages)) {
    api.writeJSON(SESSION_PATH, messages)
  }
}

const isDone = async (api: IsolateApi) => {
  const messages = await api.readJSON<MessageParam[]>(SESSION_PATH)
  const assistant =
    messages[messages.length - 1] as OpenAI.ChatCompletionMessage
  if (!assistant.tool_calls) {
    debugResult(assistant.content || '')
    return true
  }
  return false
}

const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const ai = new OpenAI({ apiKey, timeout: 20 * 1000, maxRetries: 5 })

export const transcribe = async (file: File) => {
  const transcription = await ai.audio.transcriptions
    .create({ file, model: 'whisper-1' })
  return transcription.text
}
