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
import { assert, Debug } from '@utils'
import * as longthread from './longthread.ts'
import { halt } from '@/isolates/ai-completions.ts'
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
      'Create a new thread.  If the agent image is not specified then it will use the configured default agent.  Any file from anywhere can be used as an agent.',
    required: ['agentPath'],
    properties: {
      agentPath: {
        type: 'string',
        minLength: 1,
        description: 'The relative path to the agent .md file to load',
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
  thread: (params: { path: string }) => void
  relay: (params: { request: UnsequencedRequest }) => void
  focus: (params: { threadId: string }) => Promise<void>
}

export const functions: Functions<Api> = {
  create: async (_, api) => {
    const threadId = assertBackchatThread(api)
    const path = 'agents/backchat.md'

    const { start } = await api.functions<longthread.Api>('longthread')
    await start({ threadId })
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

    if (threadId !== backchatId) {
      const isSummoned = await isBackchatSummoned(content, api)
      if (isSummoned) {
        log('backchat was summoned')
        threadId = backchatId
      }
    }

    const backchat = await readBackchat(api)
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
      return functions.switchboard({ threadId, content, actorId })
    }

    log('regular thread', threadId)
    const target = addPeer(api.pid, threadId)
    const actions = await api.actions<longthread.Api>('longthread', { target })
    return actions.switchboard({ threadId, content, actorId })

    // TODO handle remote threadIds with symlinks in the threads dir
  },
  thread: async ({ path }, api) => {
    log('thread:', path, print(api.pid))
    const threadId = generateThreadId(api.commit + 'thread' + path)

    const target = getActorPid(api.pid)
    const actions = await api.actions<actors.Api>('actors', { target })
    const pid = await actions.thread({ threadId })
    const backchat = await readBackchat(api)
    backchat.focus = threadId
    writeBackchat(backchat, api)
    log('thread started:', print(pid))
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
const isBackchatSummoned = async (content: string, api: IA) => {
  const path = `agents/summoner.md`
  const result = await halt(content, path, 'utils', 'trueOrFalse', api)
  const { value } = result
  assert(typeof value === 'boolean', 'value is not a boolean')
  return value
}
