import {
  backchatIdRegex,
  BackchatThread,
  IsolateApi,
  PID,
  threadIdRegex,
  UnsequencedRequest,
} from '@/constants.ts'
import * as load from './load-agent.ts'
import { assert } from '@std/assert'

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
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  upsertThread: {
    type: 'object',
    description:
      'Create a new thread or resume an existing thread by way of branching with the existing file.  If the agent image is not specified then it will use the configured default agent image.  Any file from anywhere can be used as an image.',
    required: ['agentImage'],
    properties: {
      agent: { type: 'string', minLength: 1, description: 'The n' },
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
  /**
   * @param { threadId } The initial thread to spawn
   * @returns
   */
  create: (params?: { focusId?: string }) => Promise<PID>
  prompt: (params: { text: string }) => void
  upsertThread: (params: { agentImage: string }) => void
  relay: (params: Relay) => void
  focus: (params: { threadId: PID }) => Promise<void>
}

interface Relay {
  request: UnsequencedRequest
}
export const functions = {
  create: async (params: { focus?: string }, api: IsolateApi) => {
    const backchatId = api.pid.branches[2]
    const { focus = backchatId } = params
    assert(backchatIdRegex.test(backchatId), 'Invalid backchat id')

    const { load } = await api.functions<load.Api>('load-agent')
    const agent = await load({ path: 'agents/backchat.md' })
    const backchatThread: BackchatThread = {
      agent,
      messages: [],
      toolCommits: {},
      focus,
    }
    api.writeJSON(`threads/${backchatId}.json`, backchatThread)
  },
  prompt: async (params: { text: string }) => {
    // send the prompt to the current thread
  },
  upsertThread: async (params: { agentImage: string }) => {
    // create a new thread or resume an existing thread
  },
  relay: ({ request }: Relay, api: IsolateApi) => {
    // TODO replace this with native relay ability
    return api.action(request)
  },
  focus: async (params: { threadId: PID }) => {
    // focus on a thread
  },
}
