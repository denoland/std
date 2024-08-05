import { assert, Debug } from '@utils'
import { actorIdRegex, getThreadPath, IA, print, Thread } from '@/constants.ts'
import { Functions } from '@/constants.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'
import * as completions from '@/isolates/ai-completions.ts'
const log = Debug('AI:longthread')

export const api = {
  start: {
    description: 'start a new thread for the given agent',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  run: {
    type: 'object',
    required: ['path', 'content', 'actorId'],
    properties: {
      path: { type: 'string' },
      content: { type: 'string' },
      actorId: { type: 'string' },
    },
    additionalProperties: false,
  },
  switchboard: {
    type: 'object',
    required: ['content', 'actorId'],
    properties: {
      content: { type: 'string' },
      actorId: { type: 'string', pattern: actorIdRegex.source },
    },
    additionalProperties: false,
  },
}
export interface Api {
  start: (params: void) => Promise<void>
  run: (params: {
    /** Path to the agent to instantiate */
    path: string
    content: string
    actorId: string
  }) => Promise<void>
  switchboard: (
    params: { content: string; actorId: string },
  ) => Promise<void>
}

export const functions: Functions<Api> = {
  start: async (_: void, api) => {
    const threadPath = getThreadPath(api.pid)
    log('start', threadPath, print(api.pid))
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const thread: Thread = {
      messages: [],
      toolCommits: {},
    }
    api.writeJSON(threadPath, thread)
  },
  run: async ({ path, content, actorId }, api) => {
    log('run', path, content, actorId)
    const threadPath = getThreadPath(api.pid)
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
    await loop(path, api)
  },
  switchboard: async ({ content, actorId }, api) => {
    const threadPath = getThreadPath(api.pid)
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)

    const path = `agents/switchboard.md`
    const { halt } = await api.actions<completions.Api>('ai-completions')
    const params = await halt({ path, content })

    log('switchboard:', params)
    assert('path' in params, 'missing path in switchboard result')
    assert(typeof params.path === 'string', 'invalid switchboard path')

    await loop(params.path, api)
  },
}

const loop = async (path: string, api: IA) => {
  const threadPath = getThreadPath(api.pid)
  const { complete } = await api.actions<completions.Api>('ai-completions')
  while (!await isDone(threadPath, api)) {
    await complete({ path })
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
  if (!last) {
    return false
  }
  if (last.role === 'user' || last.role === 'assistant') {
    log(`${last.role}:${last.name}:`, last.content)
  }
  if (last.role === 'tool') {
    // log('tool:', last.tool_call_id, last.content)
  }
  if (last.role !== 'assistant') {
    return false
  }
  if ('tool_calls' in last) {
    log(last.name, last.tool_calls)
    return false
  }
  if ('tool_call_id' in last) {
    log(last.name, last.content)
    return false
  }
  return true
}
