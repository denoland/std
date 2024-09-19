import { assert, Debug, equal } from '@utils'
import {
  Agent,
  CompletionMessage,
  getThreadPath,
  IA,
  pidSchema,
  print,
  Thread,
  ToApiType,
} from '@/constants.ts'
import { ToolMessage } from '@/api/zod.ts'
import { Functions } from '@/constants.ts'
import { load } from './utils/load-agent.ts'
import { executeTools } from './utils/ai-execute-tools.ts'
import { z } from 'zod'
import * as completions from '@/isolates/ai-completions.ts'
import * as agents from '@/isolates/agents.ts'
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
    /** tool names to stop on */
    stopOnTools: z.array(z.string()),
  }),
  changeRemote: z.object({
    remote: pidSchema.optional(),
  }),
}
export const returns = {
  start: z.void(),
  run: z.void(),
  /** If the tools reqeuested a new thread to be formed, or a change to the
   * backchat target thread */
  switchboard: z.object({
    newThread: z.boolean().optional(),
    changeThread: pidSchema.optional(),
  }).refine((v) => !(v.newThread && v.changeThread), {
    message: 'expected newThread or changeThread exclusively',
  }),
  drone: z.union([
    z.object({ functionName: z.string(), args: z.record(z.unknown()) }),
    z.undefined(),
  ]),
  changeRemote: z.void(),
}

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
      focusedFiles: [],
    }
    api.writeJSON(threadPath, thread)
  },
  run: async ({ path, content, actorId }, api) => {
    // TODO sniff actorId from the action source
    log('run', { path, content, actorId })
    const threadPath = getThreadPath(api.pid)
    let thread = await api.readThread(threadPath)

    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
    await loop(path, api, [])
    thread = await api.readThread(threadPath)
    const last = thread.messages[thread.messages.length - 1]
    assert(last.role === 'assistant', 'not assistant: ' + last.role)
    assert(typeof last.content === 'string', 'expected string content')
  },
  switchboard: async ({ content, actorId }, api) => {
    // TODO handle remote threadIds with symlinks in the threads dir

    const path = `agents/switchboard.md`
    // TODO change this to be a drone call
    // verify the switchboard has the right tool loaded
    // TODO verify stopOnTool function returns null

    const overrides = await load(path, api)
    overrides.config.parallel_tool_calls = false
    overrides.config.tool_choice = 'required'
    overrides.commands.push('agents:switch')

    const threadPath = getThreadPath(api.pid)
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)

    const switchResult = await loop(path, api, ['agents_switch'], overrides)
    assert(switchResult, 'expected switchboard result')
    assert(switchResult.functionName === 'agents_switch', 'not agents_switch')
    const { path: next } = agents.parameters.switch.parse(switchResult.args)

    const stopOnTools = []
    if (next === `agents/backchat.md`) {
      stopOnTools.push(
        'backchat_newThreadSignal',
        'backchat_changeThreadSignal',
      )
    }

    const agentResult = await loop(next, api, stopOnTools)
    const result: z.infer<typeof returns.switchboard> = {}
    if (agentResult) {
      const { functionName } = agentResult
      if (functionName === 'backchat_newThreadSignal') {
        result.newThread = true
      } else if (functionName === 'backchat_changeThreadSignal') {
        result.changeThread = api.pid
      }
    }
    // TODO verify the agent can actually end somehow
    return result
  },
  drone: async ({ path, content, actorId, stopOnTools }, api) => {
    // TODO verify stopOnTools are all present in the agent and have the
    // expected return value of null
    log('drone', path, content, actorId, stopOnTools)
    await functions.start({}, api)

    const threadPath = getThreadPath(api.pid)
    const thread = await api.readJSON<Thread>(threadPath)
    thread.messages.push({ name: actorId, role: 'user', content })
    api.writeJSON(threadPath, thread)
    return loop(path, api, stopOnTools)
  },
  changeRemote: async ({ remote }, api) => {
    const threadPath = getThreadPath(api.pid)
    const thread = await api.readThread(threadPath)

    if (equal(thread.remote, remote)) {
      return
    }
    const id = 'call_keVDORgd16XuNBh0PMk5leKP'
    thread.messages.push({
      role: 'assistant',
      tool_calls: [
        {
          type: 'function',
          function: {
            name: 'SYSTEM_changeRemote',
            arguments: JSON.stringify(remote ? { remote } : {}),
          },
          id,
        },
      ],
    }, { role: 'tool', content: 'null', tool_call_id: id })

    if (remote) {
      const opts = { target: remote }
      await api.readThread(getThreadPath(remote), opts)
      thread.remote = remote
    } else {
      delete thread.remote
    }
    api.writeJSON(threadPath, thread)
  },
}

const loop = async (
  path: string,
  api: IA,
  stopOnTools: string[],
  overrides?: Partial<Agent>,
) => {
  const threadPath = getThreadPath(api.pid)
  const { complete } = await api.actions<completions.Api>('ai-completions')
  const HARD_STOP = 20
  let count = 0
  stopOnTools = addDefaults(stopOnTools)

  while (!await isDone(threadPath, api, stopOnTools) && count++ < HARD_STOP) {
    await complete({ path, overrides })
    if (await isDone(threadPath, api)) {
      break
    }
    // TODO check tool returns are checked against schema
    await executeTools(threadPath, api, stopOnTools, overrides)
  }
  if (count >= HARD_STOP) {
    throw new Error('LONGTHREAD hard stop after: ' + HARD_STOP + ' loops')
  }

  const thread = await api.readThread(threadPath)
  const last = thread.messages[thread.messages.length - 1]
  if (last.role === 'tool') {
    const assistant = thread.messages[thread.messages.length - 2]
    assert(assistant.role === 'assistant', 'not assistant: ' + last.role)
    assert(assistant.tool_calls?.length === 1, 'expected one tool call')

    const args = JSON.parse(assistant.tool_calls[0].function.arguments)
    const functionName = assistant.tool_calls[0].function.name
    log('tool call', functionName, args)
    return { functionName, args }
  }
}

const isDone = async (threadPath: string, api: IA, stopOnTools?: string[]) => {
  const thread = await api.readJSON<Thread>(threadPath)
  const last = thread.messages[thread.messages.length - 1]
  if (!last) {
    return false
  }
  if (last.role === 'user' || last.role === 'assistant') {
    log(`${last.role}:${last.name}:`, last.content)
  }
  if (last.role === 'tool') {
    if (stopOnTools) {
      const prior = thread.messages[thread.messages.length - 2]
      if (isStopOnTool(prior, last, stopOnTools)) {
        return true
      }
    }
  }
  if (last.role !== 'assistant') {
    return false
  }
  if ('tool_calls' in last) {
    return false
  }
  return true
}

const isStopOnTool = (
  prior: CompletionMessage,
  tool: ToolMessage,
  stopOnTools: string[],
) => {
  if (prior.role !== 'assistant') {
    return false
  }
  if (!prior.tool_calls) {
    return false
  }
  if (prior.tool_calls.length !== 1) {
    return false
  }
  if (!stopOnTools.includes(prior.tool_calls[0].function.name)) {
    return false
  }
  if (tool.content !== 'null') {
    return false
  }
  return true
}
const addDefaults = (stopOnTools: string[]) => {
  const result = [...stopOnTools]
  if (!result.includes('utils_resolve')) {
    result.push('utils_resolve')
  }
  if (!result.includes('utils_reject')) {
    result.push('utils_reject')
  }
  return result
}
