import { assert, Debug } from '@utils'
import { AssistantsThread, getThreadPath, IA, PID } from '@/constants.ts'
import { Functions } from '@/constants.ts'
import * as effects from './assistants-effects.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'
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
  delete: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  deleteAllAgents: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}
export interface Api {
  start: (params: void) => Promise<PID>
  run: (params: {
    /** Path to the agent to instantiate */
    path: string
    content: string
    actorId: string
  }) => Promise<void>
  delete: (params: void) => Promise<void>
  deleteAllAgents: (params: void) => Promise<void>
}

export const functions: Functions<Api> = {
  start: async (_, api) => {
    log('start')
    const threadPath = getThreadPath(api.pid)
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const { createThread } = await api.actions<effects.Api>(
      'assistants-effects',
    )
    const externalId = await createThread()
    const thread: AssistantsThread = {
      messageOffset: 0,
      messages: [],
      toolCommits: {},
      externalId,
      additionalMessages: [],
      stateboards: [],
      foci: [],
    }
    api.writeJSON(threadPath, thread)
    return api.pid
  },
  run: async ({ path, content, actorId }, api) => {
    log('run', path, content, actorId)
    const { run } = await api.actions<effects.Api>('assistants-effects')
    const threadPath = getThreadPath(api.pid)
    // TODO this is not tested at all
    while (!await isDone(threadPath, api)) {
      await run({ content, path, actorId })
      if (await isDone(threadPath, api)) {
        return
      }
      // TODO check tool responses come back correct
      await executeTools(threadPath, api)
    }
  },
  delete: async (_, api) => {
    log('delete')
    const threadPath = getThreadPath(api.pid)
    const { externalId } = await api.readJSON<AssistantsThread>(threadPath)
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
  const thread = await api.readJSON<AssistantsThread>(threadPath)
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
