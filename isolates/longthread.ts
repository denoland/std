import { assert } from '@utils'
import { IA, LongThread, PID, Thread } from '@/constants.ts'
import { Functions } from '@/constants.ts'
import * as completions from './ai-completions.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'

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
}

export const functions: Functions<Api> = {
  start: async ({ threadId }, api) => {
    const threadPath = `threads/${threadId}.json`
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const { createThread } = await api.actions<completions.Api>(
      'ai-completions',
    )
    const externalId = await createThread()
    const thread: LongThread = { messages: [], toolCommits: {}, externalId }
    api.writeJSON(threadPath, thread)
    return api.pid
  },
  run: async ({ threadId, path, content, actorId }, api) => {
    const { run } = await api.actions<completions.Api>('ai-completions')
    const threadPath = `threads/${threadId}.json`
    while (!await isDone(threadPath, api)) {
      await run({ threadId, content, path, actorId })
      if (await isDone(threadPath, api)) {
        return
      }
      // TODO check tool responses come back correct
      await executeTools(threadPath, api)
    }
  },
}

const isDone = async (threadPath: string, api: IA) => {
  const thread = await api.readJSON<Thread>(threadPath)
  const last = thread.messages[thread.messages.length - 1]
  if (!last || last.role !== 'assistant') {
    return false
  }
  if ('tool_calls' in last) {
    return false
  }
  if ('tool_call_id' in last) {
    return false
  }
  return true
}
