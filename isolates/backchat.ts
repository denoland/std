import {
  addPeer,
  backchatIdRegex,
  BackchatThread,
  generateThreadId,
  getActorId,
  getActorPid,
  IA,
  isBackchatSummoned,
  PID,
  print,
  Thread,
  threadIdRegex,
  UnsequencedRequest,
} from '@/constants.ts'
import * as actors from './actors.ts'
import { assert, Debug } from '@utils'
import * as thread from './thread.ts'
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
      threadId: { type: 'string' },
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

interface PromptArgs {
  content?: string
  threadId?: string
  attachments?: string[]
}
interface ThreadArgs {
  agentPath: string
}
interface RelayArgs {
  request: UnsequencedRequest
}
interface FocusArgs {
  threadId: string
}
export type Api = {
  create: (params?: { focusId?: string }) => Promise<PID>
  prompt: (params: PromptArgs) => void
  thread: (params: ThreadArgs) => void
  relay: (params: RelayArgs) => void
  focus: (params: FocusArgs) => Promise<void>
}

export const functions = {
  create: async (params: { focus?: string }, api: IA) => {
    const threadId = assertBackchatThread(api)
    const agentPath = 'agents/backchat.md'

    // read from the actor config to get what the default thread should be
    // start the default thread in the background
    // also read what the backchat agentPath should be

    const { start } = await api.functions<thread.Api>('thread')
    await start({ threadId, agentPath })
    log('create:', threadId, agentPath, params.focus)
    const thread = await readBackchat(api)
    if (params.focus) {
      assert(threadIdRegex.test(params.focus), 'Invalid thread id')
      // const threadPath = `threads/${params.focus}.json`
      // create the new thread at the actor level, possibly in parallel too ?
      // verify the thread exists
      // await functions.focus({ threadId: params.focus }, api)
    } else {
      thread.focus = threadId
    }
    log('setting focus to:', thread.focus)
    writeBackchat(thread, api)
  },
  async prompt({ content = '', threadId, attachments }: PromptArgs, api: IA) {
    log('prompt: %o', content)
    log('threadId: %o attachments: %o', threadId, attachments)
    const backchatId = assertBackchatThread(api)
    const actorId = getActorId(api.pid)

    if (threadId) {
      // await assertThreadId(threadId, api) // TODO make this function work
      // // if this is self, send to self using a function
      // // else send to the other thread using an action
      // throw new Error('not implemented')
    }

    if (isBackchatSummoned(content)) {
      log('backchat was summoned')
      threadId = backchatId
    }

    if (!threadId) {
      const selfPath = `threads/${backchatId}.json`
      const backchat = await api.readJSON<BackchatThread>(selfPath)
      threadId = backchat.focus || backchatId
    }

    if (threadId === backchatId) {
      const functions = await api.functions<thread.Api>('thread')
      return functions.addMessageRun({ threadId, content, actorId })
    }
    const target = addPeer(api.pid, threadId)
    const actions = await api.actions<thread.Api>('thread', { target })
    return actions.addMessageRun({ threadId, content, actorId })

    // TODO handle remote threadIds with symlinks in the threads dir
  },
  thread: async ({ agentPath }: ThreadArgs, api: IA) => {
    log('thread:', agentPath, print(api.pid))
    const threadId = generateThreadId(api.commit + 'thread' + agentPath)

    const target = getActorPid(api.pid)
    const actions = await api.actions<actors.Api>('actors', { target })
    const pid = await actions.thread({ agentPath, threadId })
    const backchat = await readBackchat(api)
    backchat.focus = threadId
    writeBackchat(backchat, api)
    log('thread started:', print(pid))
    return { focus: threadId }
  },
  relay: ({ request }: RelayArgs, api: IA) => {
    // TODO replace this with native relay ability
    return api.action(request)
  },
  focus: async ({ threadId }: FocusArgs, api: IA) => {
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
const assertThreadId = async (threadId: string, api: IA) => {
  assert(threadIdRegex.test(threadId), 'Invalid thread id: ' + threadId)
  // TODO make this a system function
  // const target = getParent(api.pid)
  // const { ls } = await api.actions<branches.Api>('branches', { target })
  const threadPath = `threads/${threadId}.json`
  // NOT WORKING
  // needs to read the .io.json from the parent and ensure the threadId is valid

  api.lsChildren()
  const thread = await api.readJSON<Thread>(threadPath)
  assert(thread, `Thread not found: ${threadId}`)
  return thread
}
