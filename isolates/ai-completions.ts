import { assert, Debug } from '@utils'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import '@std/dotenv/load'
import { Help, IsolateApi, print } from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
type MessageParam = OpenAI.ChatCompletionMessageParam
const base = 'AI:completions'
const log = Debug(base)
const debugPart = Debug(base + ':ai-part')

const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const ai = new OpenAI({ apiKey, timeout: 20 * 1000, maxRetries: 5 })

export const api = {
  create: {
    type: 'object',
    // TODO write json schema for helps
  },
}

export const SESSION_PATH = 'session.json'
export type Api = {
  create: (help: Help) => Promise<void>
}
export const functions = {
  async create(help: Help, api: IsolateApi): Promise<string | void> {
    const tools = await loadTools(help.commands, api)
    const { model = 'gpt-4o', temperature = 0 } = help.config || {}
    const messages = await api.readJSON<MessageParam[]>(SESSION_PATH)
    const args: OpenAI.ChatCompletionCreateParamsStreaming = {
      model,
      temperature,
      messages: [...messages],
      stream: true,
      seed: 1,
      tools,
    }
    const assistant: OpenAI.ChatCompletionMessage = {
      role: 'assistant',
      content: null,
    }
    messages.push(assistant)
    api.writeJSON(SESSION_PATH, messages)

    log('streamCall started', print(api.pid))
    const streamCall = await ai.chat.completions.create(args)
    log('streamCall placed')
    for await (const part of streamCall) {
      const content = part.choices[0]?.delta?.content
      if (content) {
        debugPart(content)
        if (!assistant.content) {
          assistant.content = ''
        }
        assistant.content += content
      }

      const toolCalls = part.choices[0]?.delta?.tool_calls
      if (toolCalls) {
        assert(Array.isArray(toolCalls), 'toolCalls must be an array')
        if (!assistant.tool_calls) {
          assistant.tool_calls = []
        }
        for (const call of toolCalls) {
          const { index, ...rest } = call
          assert(Number.isInteger(index), 'toolCalls index must be an integer')
          if (!assistant.tool_calls[index]) {
            const { id } = call
            assert(id, 'toolCalls id must be a string')
            const callChunk = {} as OpenAI.ChatCompletionMessageToolCall
            assistant.tool_calls[index] = callChunk
          }
          const existing = assistant.tool_calls[index].function?.arguments || ''
          const args = { function: { arguments: existing } }
          if (rest?.function?.arguments) {
            args.function.arguments += rest.function.arguments
          }
          merge(assistant.tool_calls[index], rest, args)
          debugPart(`%o`, assistant.tool_calls[index]?.function)
        }
      }
      api.writeJSON(SESSION_PATH, messages)
    }
    log('streamCall complete', assistant)
    if (assistant.content) {
      return assistant.content
    }
  },
}
