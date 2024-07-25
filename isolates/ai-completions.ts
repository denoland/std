import { Debug } from '@utils'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import { Agent, Functions, print, Thread } from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
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
    required: ['threadId'],
    additionalProperties: false,
    properties: { threadId: { type: 'string' } },
  },
}

export type Api = {
  complete: (params: { threadId: string }) => Promise<void>
}
export const functions: Functions<Api> = {
  async complete({ threadId }, api) {
    const threadPath = `threads/${threadId}.json`
    log('completing thread %o', threadId, print(api.pid))
    const thread = await api.readJSON<Thread>(threadPath)
    // TODO assert thread is correctly formatted
    const tools = await loadTools(thread.agent.commands, api)
    const { model = 'gpt-4o-mini', temperature = 0, tool_choice = 'auto' }:
      Agent['config'] = thread.agent.config || {}
    const args: OpenAI.ChatCompletionCreateParams = {
      model,
      temperature,
      messages: [...thread.messages],
      seed: 1337,
      tools,
      tool_choice: tools && tool_choice,
    }

    log('completion started with model: %o', args.model, print(api.pid))
    const completion = await ai.chat.completions.create(args)
    const assistant = completion.choices[0].message
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
}
