import { assert } from '@utils'
import { AGENT_RUNNERS, IsolateApi, Thread } from '@/constants.ts'
import { Agent } from '@/constants.ts'
import * as loadAgent from './load-agent.ts'
import * as chatRunner from './ai-runner.ts'
const runners = { [AGENT_RUNNERS.CHAT]: chatRunner }

export const api = {
  start: {
    description: 'start a new thread for the given agent',
    type: 'object',
    additionalProperties: false,
    required: ['threadPath', 'agentPath'],
    properties: {
      threadPath: {
        description: 'path to the thread file to start',
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
    required: ['threadPath', 'content'],
    properties: {
      threadPath: {
        description: 'path to the thread file',
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
  threadPath: string
  agentPath: string
}
interface AddMessageArgs {
  threadPath: string
  content: string
  userId?: string
}
interface ExecuteArgs {
  threadId: string
  agentPath: string
  content: string
  userId?: string
}
export interface Api {
  start: (params: StartArgs) => Promise<void>
  addMessage: (params: AddMessageArgs) => Promise<void>
  execute: (params: ExecuteArgs) => Promise<string | void>
}

export const functions = {
  startThread: async (
    { threadPath, agentPath }: StartArgs,
    api: IsolateApi,
  ) => {
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
    { threadPath, content, userId = '' }: AddMessageArgs,
    api: IsolateApi,
  ) => {
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: userId, role: 'user', content })
    api.writeJSON(threadPath, thread)
  },
  execute: async (
    { threadId, agentPath, content, userId = '' }: ExecuteArgs,
    api: IsolateApi,
  ) => {
    const threadPath = `threads/${threadId}.json`
    await functions.startThread({ threadPath, agentPath }, api)
    await functions.addMessage({ threadPath, content, userId }, api)

    const { agent } = await api.readJSON<Thread>(threadPath)
    // idea is that the runner is switchable
    const runner = runners[agent.runner]
    assert(runner, 'missing runner')
    return runner.functions.run({ threadPath, content, userId }, api)
  },
}
