import { assert } from '@utils'
import { Functions, IA, PID, Thread } from '@/constants.ts'
import { Agent } from '@/constants.ts'
import * as loadAgent from './load-agent.ts'
import * as completions from './ai-completions.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'

export const api = {
  start: {
    description: 'start a new thread for the given agent',
    type: 'object',
    additionalProperties: false,
    required: ['threadId', 'agentPath'],
    properties: {
      threadId: {
        description: 'the id of the thread to execute',
        type: 'string',
      },
      agentPath: {
        description: 'path to the agent file to use for the thread',
        type: 'string',
      },
    },
  },
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
    },
    required: ['threadId'],
    additionalProperties: false,
  },
  addMessageRun: {
    description: 'add a message from the user to the thread and run the thread',
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
  execute: {
    description:
      'execute the agent on the thread from scratch, until exhaustion',
    type: 'object',
    additionalProperties: false,
    required: ['threadId', 'agentPath', 'content'],
    properties: {
      threadId: {
        description: 'the id of the thread to execute',
        type: 'string',
      },
      agentPath: {
        description: 'path to the agent file to use for the thread',
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
}
export interface Api {
  start: (params: { threadId: string; agentPath: string }) => Promise<PID>
  addMessage: (params: {
    threadId: string
    content: string
    actorId?: string
  }) => Promise<void>
  run: (params: {
    threadId: string
  }) => Promise<string | void>
  addMessageRun: (params: {
    threadId: string
    content: string
    actorId?: string
  }) => Promise<string | void>
  execute: (params: {
    threadId: string
    agentPath: string
    content: string
    actorId?: string
  }) => Promise<string | void>
}

export const functions: Functions<Api> = {
  start: async ({ threadId, agentPath }, api) => {
    const threadPath = `threads/${threadId}.json`
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const { load } = await api.functions<loadAgent.Api>('load-agent')
    const agent: Agent = await load({ path: agentPath })
    const messages: Thread['messages'] = []
    if (agent.instructions) {
      messages.push({
        name: agent.name,
        role: 'system',
        content: agent.instructions,
      })
    }
    const thread: Thread = {
      messages,
      agent,
      toolCommits: {},
    }
    api.writeJSON(threadPath, thread)
    return api.pid
  },
  addMessage: async ({ threadId, content, actorId = '0' }, api) => {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
  },
  run: async ({ threadId }, api) => {
    const { complete } = await api.actions<completions.Api>('ai-completions')
    let result
    const threadPath = `threads/${threadId}.json`
    while (!await isDone(threadPath, api)) {
      result = await complete({ threadId })
      if (await isDone(threadPath, api)) {
        return result
      }
      // TODO check tool responses come back correct
      result = await executeTools(threadPath, api)
    }
    return result
  },
  addMessageRun: async ({ threadId, content, actorId = '0' }, api) => {
    await functions.addMessage({ threadId, content, actorId }, api)
    return functions.run({ threadId }, api)
  },
  execute: async ({ threadId, agentPath, content, actorId = '0' }, api) => {
    await functions.start({ threadId, agentPath }, api)
    return functions.addMessageRun({ threadId, content, actorId }, api)
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
