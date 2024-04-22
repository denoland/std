import { assert } from '@std/assert'
import { executeTools } from './ai-execute-tools.ts'
import { Debug, equal, posix } from '@utils'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import { serializeError } from 'serialize-error'
import { load } from '@std/dotenv'
import { Help, IsolateApi } from '@/constants.ts'
import { HelpConfig, JSONSchemaType } from '@/constants.ts'
import * as loadHelp from '@/isolates/load-help.ts'
import { Api, SESSION_PATH } from './ai-completions.ts'

type MessageParam = OpenAI.ChatCompletionMessageParam
const base = 'AI:runner-chat'
const log = Debug(base)
const debugResult = Debug(base + ':ai-result-content')
const debugPart = Debug(base + ':ai-part')
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

const env = await load()

if (!env['OPENAI_API_KEY']) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    throw new Error('missing openai api key: OPENAI_API_KEY')
  }
  env['OPENAI_API_KEY'] = key
}
const apiKey = env['OPENAI_API_KEY']
const ai = new OpenAI({ apiKey, timeout: 20 * 1000, maxRetries: 5 })
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
    assert(text.length, 'text must not be empty')
    let messages: MessageParam[] = []
    let existing: MessageParam[] | undefined
    if (await api.exists(SESSION_PATH)) {
      log('session exists')
      messages = await api.readJSON<MessageParam[]>(SESSION_PATH)
      existing = messages
    }
    assert(Array.isArray(messages), 'messages must be an array')

    const sysprompt = help.instructions.join('\n').trim()
    if (sysprompt) {
      if (!equal(messages[0], { role: 'system', content: sysprompt })) {
        if (messages[0]?.role === 'system') {
          messages.shift()
        }
        messages.unshift({ role: 'system', content: sysprompt })
      }
    }
    if (text) {
      messages.push({ role: 'user', content: text })
    }
    if (!equal(existing, messages)) {
      api.writeJSON(SESSION_PATH, messages)
    }
    const { create } = await api.actions<Api>('completions')
    while (!(await isDone(api))) {
      await create(help)
      if (await isDone(api)) {
        return
      }
      await executeTools(help, api)
    }
  },
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

export const transcribe = async (file: File) => {
  // TODO useEffect() here ?
  const transcription = await ai.audio.transcriptions
    .create({ file, model: 'whisper-1' })
  return transcription.text
}
