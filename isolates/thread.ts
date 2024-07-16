import { assert } from '@utils'
import { IsolateApi, Thread } from '@/constants.ts'
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
      userId: {
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
      userId: {
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
      userId: {
        description: 'the user id of the message author',
        type: 'string',
      },
    },
  },
}
interface StartArgs {
  threadId: string
  agentPath: string
}
interface MessageArgs {
  threadId: string
  content: string
  userId?: string
}
interface RunArgs {
  threadId: string
}
interface ExecuteArgs {
  threadId: string
  agentPath: string
  content: string
  userId?: string
}
export interface Api {
  start: (params: StartArgs) => Promise<void>
  addMessage: (params: MessageArgs) => Promise<void>
  run: (params: RunArgs) => Promise<string | void>
  addMessageRun: (params: MessageArgs) => Promise<string | void>
  execute: (params: ExecuteArgs) => Promise<string | void>
}

export const functions = {
  start: async (
    { threadId, agentPath }: StartArgs,
    api: IsolateApi,
  ) => {
    const threadPath = `threads/${threadId}.json`
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const { load } = await api.functions<loadAgent.Api>('load-agent')
    console.log('load', agentPath)
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
  },
  addMessage: async (
    { threadId, content, userId = '0' }: MessageArgs,
    api: IsolateApi,
  ) => {
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: userId, role: 'user', content })
    api.writeJSON(threadPath, thread)
  },
  run: async ({ threadId }: RunArgs, api: IsolateApi) => {
    const { complete } = await api.actions<completions.Api>('ai-completions')
    let result
    const threadPath = `threads/${threadId}.json`
    while (!await isDone(threadPath, api)) {
      result = await complete({ threadPath })
      if (await isDone(threadPath, api)) {
        return result
      }
      // TODO check tool responses come back correct
      result = await executeTools(threadPath, api)
    }
    return result
  },
  addMessageRun: async (
    { threadId, content, userId = '0' }: MessageArgs,
    api: IsolateApi,
  ) => {
    await functions.addMessage({ threadId, content, userId }, api)
    return functions.run({ threadId }, api)
  },
  execute: async (
    { threadId, agentPath, content, userId = '0' }: ExecuteArgs,
    api: IsolateApi,
  ) => {
    await functions.start({ threadId, agentPath }, api)
    return functions.addMessageRun({ threadId, content, userId }, api)
  },
}

const isDone = async (threadPath: string, api: IsolateApi) => {
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
