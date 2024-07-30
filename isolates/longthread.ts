import { assert, Debug } from '@utils'
import {
  actorIdRegex,
  backchatIdRegex,
  IA,
  PID,
  print,
  Thread,
  threadIdRegex,
} from '@/constants.ts'
import { Functions } from '@/constants.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'
import * as completions from '@/isolates/ai-completions.ts'
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
  switchboard: {
    type: 'object',
    required: ['threadId', 'content', 'actorId'],
    properties: {
      threadId: {
        type: 'string',
        pattern: threadIdRegex.source + '|' + backchatIdRegex.source,
      },
      content: { type: 'string' },
      actorId: { type: 'string', pattern: actorIdRegex.source },
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
  switchboard: (
    params: { threadId: string; content: string; actorId: string },
  ) => Promise<void>
}

export const functions: Functions<Api> = {
  start: async ({ threadId }, api) => {
    log('start', threadId, print(api.pid))
    const threadPath = `threads/${threadId}.json`
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const thread: Thread = {
      messages: [],
      toolCommits: {},
    }
    api.writeJSON(threadPath, thread)
    return api.pid
  },
  run: async ({ threadId, path, content, actorId }, api) => {
    log('run', threadId, path, content, actorId)
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
    await loop(threadId, path, api)
  },
  switchboard: async ({ threadId, content, actorId }, api) => {
    log('switchboard', threadId, content, actorId)
    const threadPath = `threads/${threadId}.json`
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)

    // make the switchboard call.
    const path = `agents/switchboard.md`
    const { halt } = await api.actions<completions.Api>('ai-completions')
    const params = await halt({ path, content, threadId })

    log('switchboard result', params)
    assert('path' in params, 'missing path in switchboard result')
    assert(typeof params.path === 'string', 'invalid switchboard path')

    await loop(threadId, params.path, api)
  },
}

const loop = async (threadId: string, path: string, api: IA) => {
  const threadPath = `threads/${threadId}.json`
  const { complete } = await api.actions<completions.Api>('ai-completions')
  while (!await isDone(threadPath, api)) {
    await complete({ threadId, path })
    if (await isDone(threadPath, api)) {
      return
    }
    // TODO check tool responses come back correct
    await executeTools(threadPath, api)
  }
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
