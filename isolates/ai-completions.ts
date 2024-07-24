import { Debug } from '@utils'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import {
  Agent,
  Functions,
  generateAgentHash,
  LongThread,
  print,
  Thread,
} from '@/constants.ts'
import { loadTools } from './ai-load-tools.ts'
import * as loadAgent from '@/isolates/load-agent.ts'
import { assert } from '@std/assert'
import * as machines from '@/isolates/machines.ts'
type AssistantCreateParams = OpenAI.Beta.AssistantCreateParams
type RunOptions = OpenAI.Beta.Threads.Runs.RunCreateParamsStreaming
const base = 'AI:completions'
const log = Debug(base)

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
  createThread: () => Promise<string>
  syncAgent: (params: { path: string }) => Promise<string>
  createAssistant: (
    params: AssistantCreateParams,
  ) => Promise<string>
  run: (params: {
    threadId: string
    content: string
    /** Path to the agent to use for this run */
    path: string
    actorId: string
  }) => Promise<void>
  runStream: (
    params: { threadId: string; runOptions: RunOptions },
  ) => Promise<void>
}
export const functions: Functions<Api> = {
  async complete({ threadId }, api) {
    const threadPath = `threads/${threadId}.json`
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
  async createThread() {
    const { id } = await ai.beta.threads.create()
    return id
  },
  async syncAgent({ path }, api) {
    const agent = await loadAgent.functions.load({ path }, api)
    const tools = await loadTools(agent.commands, api)

    const creation: AssistantCreateParams = {
      description: agent.description,
      temperature: agent.config.temperature,
      instructions: agent.instructions,
      name: agent.name,
      tools,
      model: agent.config.model,
    }
    const agentHash = generateAgentHash(JSON.stringify(creation))

    const existing = await machines.tryAssistantId(agentHash, api)
    if (existing) {
      return existing
    }
    const { createAssistant } = await api.actions<Api>('ai-completions')
    const id = await createAssistant(creation)
    const target = machines.getMachineTarget(api.pid)
    const { register } = await api.actions<machines.Api>('machines', { target })
    await register({ agentHash, assistantId: id })
    return id
  },
  async createAssistant(creation) {
    const { id } = await ai.beta.assistants.create(creation)
    assert(id.startsWith('asst_'), 'invalid assistant id: ' + id)
    return id
  },
  async run({ threadId, content, path, actorId }, api) {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<LongThread>(threadPath)
    assert(thread.externalId, 'thread not synced with openai')
    const message: LongThread['messages'][number] = {
      name: actorId,
      role: 'user',
      content,
    }
    thread.messages.push(message)
    api.writeJSON(threadPath, thread)

    const assistant_id = await functions.syncAgent({ path }, api)
    const additional_instructions = `The time is ${new Date().toISOString()}`
    const agent = await loadAgent.functions.load({ path }, api)

    const runOptions: RunOptions = {
      stream: true,
      assistant_id,
      additional_instructions,
      additional_messages: [message],
      parallel_tool_calls: agent.config.parallel_tool_calls,
      temperature: agent.config.temperature,
      tool_choice: agent.config.tool_choice,
    }
    const { runStream } = await api.actions<Api>('ai-completions')
    await runStream({ threadId, runOptions })
  },
  runStream({ threadId, runOptions }) {
    return new Promise((resolve, reject) => {
      const stream = ai.beta.threads.runs.stream(threadId, runOptions)
      stream
        .on('textCreated', (text) => log('\nassistant > '))
        .on('textDelta', (textDelta, snapshot) => log(textDelta.value))
        .on(
          'toolCallCreated',
          (toolCall) => log(`\nassistant > ${toolCall.type}\n\n`),
        )
        .on('toolCallDelta', (toolCallDelta, snapshot) => {
          if (toolCallDelta.type === 'code_interpreter') {
            if (toolCallDelta?.code_interpreter?.input) {
              log(toolCallDelta.code_interpreter.input)
            }
            if (toolCallDelta?.code_interpreter?.outputs) {
              log('\noutput >\n')
              toolCallDelta.code_interpreter.outputs.forEach((output) => {
                if (output.type === 'logs') {
                  log(`\n${output.logs}\n`)
                }
              })
            }
          }
        })
    })
  },
}
