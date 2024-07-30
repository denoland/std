import { Functions, IA, Thread } from '@/constants.ts'
import * as completions from './ai-completions.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'

export const api = {
  addMessage: {
    description: 'add a message from the user to the thread',
    type: 'object',
    additionalProperties: false,
    required: ['threadId', 'content'],
    properties: {
      threadId: {
        description: 'the id of the thread to execute',
        type: 'string',
      },
      content: {
        description: 'the content of the message',
        type: 'string',
      },
      actorId: {
        description: 'the user id of the message author',
        type: 'string',
      },
    },
  },
  run: {
    type: 'object',
    properties: {
      threadId: { type: 'string' },
      path: { type: 'string' },
    },
    required: ['threadId', 'path'],
    additionalProperties: false,
  },
}
export interface Api {
  addMessage: (params: {
    threadId: string
    content: string
    actorId?: string
  }) => Promise<void>
  run: (params: {
    threadId: string
    path: string
  }) => Promise<string | void>
}

export const functions: Functions<Api> = {
  addMessage: async ({ threadId, content, actorId }, api) => {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
  },
  run: async ({ threadId, path }, api) => {
    const { complete } = await api.actions<completions.Api>('ai-completions')
    let result
    const threadPath = `threads/${threadId}.json`
    while (!await isDone(threadPath, api)) {
      result = await complete({ threadId, path })
      if (await isDone(threadPath, api)) {
        return result
      }
      // TODO check tool responses come back correct
      result = await executeTools(threadPath, api)
    }
    return result
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
