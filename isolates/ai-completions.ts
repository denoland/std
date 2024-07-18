import { assert, Debug } from '@utils'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import '@std/dotenv/load'
import { IA, print, Thread } from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
const base = 'AI:completions'
const log = Debug(base)
const debugPart = Debug(base + ':ai-part')

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
      prompt: 'Backchat, GPT4, GPT3, Dreamcatcher, CRM, HAL, Deno, Stucks',
    })
  return transcription.text
}

export const api = {
  complete: {
    type: 'object',
    required: ['threadId'],
    additionalProperties: false,
    properties: { threadId: { type: 'string' } },
  },
}
interface CompleteArgs {
  threadId: string
}
export type Api = {
  complete: (params: CompleteArgs) => Promise<void>
}
export const functions = {
  async complete({ threadId }: CompleteArgs, api: IA): Promise<string | void> {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    // TODO assert thread is correctly formatted
    const tools = await loadTools(thread.agent.commands, api)
    const { model = 'gpt-4o', temperature = 0 } = thread.agent.config || {}
    const args: OpenAI.ChatCompletionCreateParamsStreaming = {
      model,
      temperature,
      messages: [...thread.messages],
      stream: true,
      seed: 1337,
      tools,
    }
    const assistant: OpenAI.ChatCompletionMessage = {
      role: 'assistant',
      content: null,
    }
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)

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
            const callChunk: OpenAI.ChatCompletionMessageToolCall = {
              id,
              function: { name: '', arguments: '' },
              type: 'function',
            }
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
      api.writeJSON(threadPath, thread)
    }
    log('streamCall complete', assistant)
    if (assistant.tool_calls) {
      log('tool calls:', assistant.tool_calls)
    }
    if (assistant.content) {
      return assistant.content
    }
  },
}
