import {
  addPeer,
  backchatIdRegex,
  BackchatThread,
  Functions,
  generateThreadId,
  getActorId,
  getActorPid,
  IA,
  print,
  threadIdRegex,
  UnsequencedRequest,
} from '@/constants.ts'
import * as actors from './actors.ts'
import { assert, Debug, expect } from '@utils'
import * as longthread from './longthread.ts'
import * as loadAgent from './load-agent.ts'
import * as completions from './ai-completions.ts'
import { loadValidators } from '@/isolates/ai-load-tools.ts'
const log = Debug('AI:backchat')

export const api = {
  create: {
    type: 'object',
    description: 'Create a new thread',
    properties: {
      focusId: {
        type: 'string',
        pattern: threadIdRegex.source,
      },
    },
    additionalProperties: false,
  },
  prompt: {
    type: 'object',
    description:
      'Send a prompt to the currently focused thread, or if this was a request to backchat, redirect it to the backchat thread.  Note that the currently focused thread could in fact be the backchat thread.',
    required: ['content'],
    properties: {
      content: { type: 'string' },
      threadId: {
        type: 'string',
        pattern: threadIdRegex.source + '|' + backchatIdRegex.source,
      },
      attachments: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
  },
  thread: {
    type: 'object',
    description:
      'Create a new blank thread and switch the current focus to this new thread so it is displayed for the user to converse with.  Optionally provide an initial prompt to the thread to start it running.',
    additionalProperties: false,
    properties: {
      prompt: {
        type: 'string',
        description: 'An initial prompt to start the thread with',
      },
    },
  },
  relay: {
    type: 'object',
    description: 'Relay a request to the requests target',
    required: ['request'],
    properties: {
      request: {
        type: 'object',
        required: ['isolate'],
        properties: {
          isolate: {
            type: 'string',
          },
          pid: {
            type: 'object',
            required: ['account', 'repository', 'branches'],
            additionalProperties: false,
            properties: {
              account: {
                type: 'string',
              },
              repository: {
                type: 'string',
              },
              branches: {
                type: 'array',
                items: {
                  type: 'string',
                },
                minItems: 1,
              },
            },
          },
        },
      },
    },
  },
  focus: {
    type: 'object',
    description: 'Focus on a thread',
    required: ['threadId'],
    properties: {
      threadId: {
        type: 'string',
        pattern: backchatIdRegex.source + '|' + threadIdRegex.source,
      },
    },
  },
}

export type Api = {
  create: (_: void) => Promise<void>
  prompt: (
    params: { content: string; threadId: string; attachments?: string[] },
  ) => void
  thread: (params: { prompt?: string }) => void
  relay: (params: { request: UnsequencedRequest }) => void
  focus: (params: { threadId: string }) => Promise<void>
}

export const functions: Functions<Api> = {
  create: async (_, api) => {
    const threadId = assertBackchatThread(api)
    const path = 'agents/backchat.md'

    const { start } = await api.functions<longthread.Api>('longthread')
    await start()
    log('create:', threadId, path)
    const thread = await readBackchat(api)
    thread.focus = threadId
    log('setting focus to:', thread.focus)
    writeBackchat(thread, api)
  },
  async prompt({ content, threadId, attachments }, api) {
    log('prompt: %o', content)
    log('threadId: %o attachments: %o', threadId, attachments)
    const backchatId = assertBackchatThread(api)
    const actorId = getActorId(api.pid)

    const backchat = await readBackchat(api)
    if (threadId !== backchatId && backchat.focus !== backchatId) {
      const isSummoned = await isBackchatSummoned(content, actorId, api)
      if (isSummoned) {
        log('backchat was summoned')
        threadId = backchatId
      }
    }

    if (!threadId) {
      threadId = backchat.focus
    }
    if (backchat.focus !== threadId) {
      backchat.focus = threadId
      writeBackchat(backchat, api)
    }

    if (threadId === backchatId) {
      log('backchat thread', threadId)
      const functions = await api.functions<longthread.Api>('longthread')
      return functions.switchboard({ content, actorId })
    }

    log('regular thread', threadId)
    const target = addPeer(api.pid, threadId)
    const actions = await api.actions<longthread.Api>('longthread', { target })
    return actions.switchboard({ content, actorId })

    // change the focus to whatever just got run
    // ensure that ai halts when the focus has shifted

    // TODO handle remote threadIds with symlinks in the threads dir
  },
  thread: async ({ prompt }, api) => {
    log('thread:', prompt, print(api.pid))
    const threadId = generateThreadId(api.commit + 'backchat:thread')

    const target = getActorPid(api.pid)
    const actions = await api.actions<actors.Api>('actors', { target })
    const pid = await actions.thread({ threadId })
    const backchat = await readBackchat(api)
    backchat.focus = threadId
    writeBackchat(backchat, api)
    log('thread started:', print(pid))

    // now insert the prompt into the thread and run it
    // at least run the thread, even if it is blank

    return { newThreadId: threadId, currentFocus: threadId }
  },
  relay: ({ request }, api) => {
    // TODO replace this with native relay ability
    return api.action(request)
  },
  focus: async ({ threadId }, api) => {
    log('focus:', threadId)
    const backchat = await readBackchat(api)
    if (threadId !== backchat.focus) {
      backchat.focus = threadId
      writeBackchat(backchat, api)
    }
  },
}
const readBackchat = (api: IA) => {
  const backchatId = getBackchatId(api)
  return api.readJSON<BackchatThread>(`threads/${backchatId}.json`)
}
const writeBackchat = (thread: BackchatThread, api: IA) => {
  const backchatId = getBackchatId(api)
  api.writeJSON(`threads/${backchatId}.json`, thread)
}
const assertBackchatThread = (api: IA) => {
  assert(api.pid.branches.length === 3, 'Invalid pid')
  return getBackchatId(api)
}
const getBackchatId = (api: IA) => {
  const backchatId = api.pid.branches[2]
  assert(backchatIdRegex.test(backchatId), 'Invalid backchat id')
  return backchatId
}
const isBackchatSummoned = async (
  content: string,
  actorId: string,
  api: IA,
) => {
  log('isBackchatSummoned')
  const path = `agents/summoner.md`
  const { load } = await api.functions<loadAgent.Api>('load-agent')
  const agent = await load({ path })
  assert(!agent.config.parallel_tool_calls, 'parallel_tool_calls not false')
  assert(agent.config.tool_choice === 'required', 'tool_choice is required')
  assert(agent.commands.length === 1, 'commands length is not 1')

  const { focus: threadId } = await readBackchat(api)
  const opts = { target: addPeer(api.pid, threadId) }
  const { once } = await api.actions<completions.Api>('ai-completions', opts)
  assert(threadIdRegex.test(threadId), 'Invalid threadId: ' + threadId)

  const assistant = await once({ path, content, actorId })
  assert(assistant.role === 'assistant', 'role is not assistant')
  assert(assistant.tool_calls, 'tool_calls missing from once call')
  assert(assistant.tool_calls.length === 1, 'tool_calls length is not 1')
  const result = assistant.tool_calls[0]
  log('result', result)

  const validators = await loadValidators(agent.commands, api)
  const { name } = result.function
  assert(validators[name], 'validator not found: ' + name)
  const parsed = JSON.parse(result.function.arguments)
  validators[name](parsed)

  const { value } = parsed
  assert(typeof value === 'boolean', 'value is not a boolean')
  return value
}
