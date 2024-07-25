import { assert, Debug } from '@utils'
import { IA, LongThread, PID } from '@/constants.ts'
import { Functions } from '@/constants.ts'
import * as effects from './assistants-effects.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'
const log = Debug('AI:longthread')

export const api = {
  start: {
    description: 'start a new thread for the given agent',
    type: 'object',
    additionalProperties: false,
    required: ['threadId'],
    properties: {
      threadId: {
        description: 'the id of the thread to execute',
        type: 'string',
      },
    },
  },
  run: {
    type: 'object',
    required: ['threadId', 'path', 'content', 'actorId'],
    properties: {
      threadId: { type: 'string' },
      path: { type: 'string' },
      content: { type: 'string' },
      actorId: { type: 'string' },
    },
    additionalProperties: false,
  },
  delete: {
    type: 'object',
    required: ['threadId'],
    properties: {
      threadId: { type: 'string' },
    },
    additionalProperties: false,
  },
  deleteAllAgents: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}
export interface Api {
  start: (params: { threadId: string }) => Promise<PID>
  run: (params: {
    threadId: string
    /** Path to the agent to instantiate */
    path: string
    content: string
    actorId: string
  }) => Promise<void>
  delete: (params: { threadId: string }) => Promise<void>
  deleteAllAgents: (params: void) => Promise<void>
}

export const functions: Functions<Api> = {
  start: async ({ threadId }, api) => {
    log('start', threadId)
    const threadPath = `threads/${threadId}.json`
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const { createThread } = await api.actions<effects.Api>(
      'assistants-effects',
    )
    const externalId = await createThread()
    const thread: LongThread = {
      messages: [],
      toolCommits: {},
      externalId,
      additionalMessages: [],
    }
    api.writeJSON(threadPath, thread)
    return api.pid
  },
  run: async ({ threadId, path, content, actorId }, api) => {
    log('run', threadId, path, content, actorId)
    const { run } = await api.actions<effects.Api>('assistants-effects')
    const threadPath = `threads/${threadId}.json`
    // TODO this is not tested at all
    while (!await isDone(threadPath, api)) {
      await run({ threadId, content, path, actorId })
      if (await isDone(threadPath, api)) {
        return
      }
      // TODO check tool responses come back correct
      await executeTools(threadPath, api)
    }
  },
  delete: async ({ threadId }, api) => {
    log('delete', threadId)
    const threadPath = `threads/${threadId}.json`
    const { externalId } = await api.readJSON<LongThread>(threadPath)
    assert(externalId, 'missing externalId: ' + threadPath)
    api.delete(threadPath)
    const { deleteThread } = await api.actions<effects.Api>(
      'assistants-effects',
    )
    await deleteThread({ externalId })
  },
  deleteAllAgents: async (_, api) => {
    const { deleteAllAgents } = await api.actions<effects.Api>(
      'assistants-effects',
    )
    await deleteAllAgents()
  },
}

const isDone = async (threadPath: string, api: IA) => {
  const thread = await api.readJSON<LongThread>(threadPath)
  const last = thread.messages[thread.messages.length - 1]
  if (!last || last.role !== 'assistant') {
    return false
  }
  assert(last.status === 'completed', 'thread not done')
  if ('tool_calls' in last) {
    return false
  }
  if ('tool_call_id' in last) {
    return false
  }
  return true
}
