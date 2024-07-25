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
  createThread: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  run: {
    type: 'object',
    required: ['threadId', 'content', 'path', 'actorId'],
    additionalProperties: false,
    properties: {
      threadId: { type: 'string' },
      content: { type: 'string' },
      path: { type: 'string' },
      actorId: { type: 'string' },
    },
  },
  createAssistant: {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
      description: { type: 'string' },
      temperature: { type: 'number' },
      instructions: { type: 'string' },
      name: { type: 'string' },
      tools: { type: 'array' },
      model: { type: 'string' },
    },
  },
  addMessage: {
    type: 'object',
    required: ['externalId', 'content'],
    additionalProperties: false,
    properties: {
      externalId: { type: 'string' },
      content: { type: 'string' },
    },
  },
  runStream: {
    type: 'object',
    required: ['threadId', 'runOptions'],
    additionalProperties: false,
    properties: {
      threadId: { type: 'string' },
      runOptions: { type: 'object' },
    },
  },
  deleteThread: {
    type: 'object',
    required: ['externalId'],
    additionalProperties: false,
    properties: {
      externalId: { type: 'string' },
    },
  },
  deleteAllAgents: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export type Api = {
  complete: (params: { threadId: string }) => Promise<void>
  createThread: () => Promise<string>
  syncAgent: (params: { path: string }) => Promise<string>
  createAssistant: (
    params: AssistantCreateParams,
  ) => Promise<string>
  addMessage: (
    params: { externalId: string; content: string },
  ) => Promise<OpenAI.Beta.Threads.Message>
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
  deleteThread: (params: { externalId: string }) => Promise<void>
  deleteAllAgents: (params: void) => Promise<void>
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
  async createThread() {
    const { id } = await ai.beta.threads.create()
    return id
  },
  async syncAgent({ path }, api) {
    log('syncing agent %o', path, print(api.pid))
    const agent = await loadAgent.functions.load({ path }, api)
    const tools = await loadTools(agent.commands, api)

    const creation: AssistantCreateParams = {
      description: agent.description,
      temperature: agent.config.temperature,
      instructions: agent.instructions,
      tools,
      model: agent.config.model,
    }
    const agentHash = generateAgentHash(JSON.stringify(creation))
    creation.name = agent.name + ' ' + agentHash

    const existing = await machines.tryAssistantId(agentHash, api)
    if (existing) {
      log('existing agent found - no sync required')
      return existing
    }
    const { createAssistant } = await api.actions<Api>('ai-completions')
    const id = await createAssistant(creation)
    log('assistant created:', id)
    const target = machines.getMachineTarget(api.pid)
    const { register } = await api.actions<machines.Api>('machines', { target })
    await register({ agentHash, assistantId: id })
    log('assistant registered')
    return id
  },
  async createAssistant(creation) {
    const { id } = await ai.beta.assistants.create(creation)
    assert(id.startsWith('asst_'), 'invalid assistant id: ' + id)
    return id
  },
  async addMessage({ externalId, content }) {
    log('adding message to %o', externalId)
    const message = await ai.beta.threads.messages.create(externalId, {
      role: 'user',
      content,
    })
    log('message added', message)
    return message
  },
  async run({ threadId, content, path }, api) {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<LongThread>(threadPath)
    const { externalId } = thread
    assert(externalId, 'thread not synced with openai')

    thread.additionalMessages.push({ role: 'user', content })
    api.writeJSON(threadPath, thread)
    const { runStream, addMessage } = await api.actions<Api>('ai-completions')

    const message = await addMessage({ externalId, content })
    thread.messages.push(message)
    thread.additionalMessages.pop()
    api.writeJSON(threadPath, thread)

    // TODO parallelize
    const assistant_id = await functions.syncAgent({ path }, api)
    const additional_instructions = `\n---\nThe time is ${
      new Date().toISOString()
    }`
    const agent = await loadAgent.functions.load({ path }, api)

    const runOptions: RunOptions = {
      stream: true,
      assistant_id,
      additional_instructions,
      parallel_tool_calls: agent.config.parallel_tool_calls,
      temperature: agent.config.temperature,
      tool_choice: agent.config.tool_choice,
    }
    await runStream({ threadId, runOptions })
  },
  async runStream({ threadId, runOptions }, api) {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<LongThread>(threadPath)
    const { externalId } = thread
    assert(externalId, 'thread not synced with openai')
    log('running stream', threadId, externalId)

    return new Promise((resolve, reject) => {
      const stream = ai.beta.threads.runs.stream(externalId, runOptions)
      stream
        .on('error', (error) => {
          log('stream error', error)
          reject(error)
        })
        .on('end', () => {
          log('stream ended')
          resolve()
        })
        .on('messageCreated', (message) => {
          log('messageCreated', message)
          thread.messages.push(message)
          api.writeJSON(threadPath, thread)
        })
        .on('messageDone', (message) => {
          log('messageDone', message)
          thread.messages.pop()
          thread.messages.push(message)
          api.writeJSON(threadPath, thread)
        })
        .on(
          'toolCallCreated',
          (toolCall) => {
            log('toolCallCreated', toolCall)
            // thread.messages.push(toolCall)
          },
        )
        .on('toolCallDone', (toolCall) => {
          log('toolCallDone', toolCall)
        })
      // .on('event', (event) => {
      //   log('event', event)
      // })
    })
  },
  async deleteThread({ externalId }) {
    await ai.beta.threads.del(externalId)
  },
  async deleteAllAgents(_, api) {
    const target = machines.getMachineTarget(api.pid)
    const { deleteAllAgents } = await api.actions<machines.Api>('machines', {
      target,
    })
    const ids = await deleteAllAgents()
    log('deleting:', ids)
    for (const id of ids) {
      await ai.beta.assistants.del(id)
    }
    log('deleted:', ids)
  },
}
