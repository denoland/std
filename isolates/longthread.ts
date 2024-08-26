import { assert, Debug } from '@utils'
import {
  getThreadPath,
  IA,
  print,
  Thread,
  toApi,
  ToApiType,
} from '@/constants.ts'
import { assistantMessage } from '@/api/zod.ts'
import { Functions } from '@/constants.ts'
import { executeTools } from '@/isolates/ai-execute-tools.ts'
import { z } from 'zod'
import * as completions from '@/isolates/ai-completions.ts'
const log = Debug('AI:longthread')

export const parameters = {
  start: z.object({}).describe('start a new thread for the given agent'),
  run: z.object({
    /** Path to the agent to instantiate */
    path: z.string(),
    content: z.string(),
    actorId: z.string(),
  }),
  switchboard: z.object({
    content: z.string(),
    actorId: z.string(),
  }),
  drone: z.object({
    /** Path to the agent to instantiate */
    path: z.string(),
    content: z.string(),
    actorId: z.string(),
    /** tool name to stop on */
    stopOnTool: z.string().optional(),
  }),
}
export const returns = {
  start: z.void(),
  run: z.void(),
  switchboard: z.void(),
  drone: assistantMessage,
}

export const api = toApi(parameters)
export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  start: async (_, api) => {
    const threadPath = getThreadPath(api.pid)
    log('start', threadPath, print(api.pid))
    assert(!await api.exists(threadPath), `thread exists: ${threadPath}`)
    const thread: Thread = {
      messageOffset: 0,
      messages: [],
      toolCommits: {},
      stateboards: [],
      foci: [],
    }
    api.writeJSON(threadPath, thread)
  },
  run: async ({ path, content, actorId }, api) => {
    // TODO sniff actorId from the action source
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
  drone: async ({ path, content, actorId, stopOnTool }, api) => {
    log('drone', path, content, actorId, stopOnTool)
    await functions.start({}, api)

    const threadPath = getThreadPath(api.pid)
    let thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
    await loop(path, api, stopOnTool)

    thread = await api.readJSON<Thread>(threadPath)
    const last = thread.messages[thread.messages.length - 1]
    assert(last.role === 'assistant', 'not assistant response: ' + last.role)
    return last
  },
}

const loop = async (path: string, api: IA, stopOnTool?: string) => {
  const threadPath = getThreadPath(api.pid)
  const { complete } = await api.actions<completions.Api>('ai-completions')
  const HARD_STOP = 10
  let count = 0
  while (!await isDone(threadPath, api) && count++ < HARD_STOP) {
    await complete({ path })
    if (await isDone(threadPath, api, stopOnTool)) {
      return
    }
    // TODO check tool responses come back correct
    await executeTools(threadPath, api)
  }
  if (count >= HARD_STOP) {
    // TODO test this actually works
    console.error('LONGTHREAD HARD_STOP after:', HARD_STOP)
  }
}

const isDone = async (threadPath: string, api: IA, stopOnTool?: string) => {
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
    if (last.tool_calls?.length === 1) {
      const tool = last.tool_calls[0]
      if (tool.function.name === 'utils_resolve') {
        log('resolved')
        return true
      }
      if (tool.function.name === 'utils_reject') {
        log('rejected')
        return true
      }
      if (stopOnTool && tool.function.name === stopOnTool) {
        log('stopping on tool:', stopOnTool)
        // TODO do a parsing check and error if the tool parameters are wrong,
        // to allow the agent to fix the erroneous tool call
        return true
      }
    }
    return false
  }
  if ('tool_call_id' in last) {
    log(last.name, last.content)
    return false
  }
  return true
}
