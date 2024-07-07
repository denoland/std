import { IsolateApi, UnsequencedRequest } from '@/constants.ts'

export const api = {
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
}

interface Relay {
  request: UnsequencedRequest
}
export const functions = {
  prompt: async (args: { text: string }) => {
    // send the prompt to the current thread
  },
  upsertThread: async (args: { agentImage: string }) => {
    // create a new thread or resume an existing thread
  },
  relay: ({ request }: Relay, api: IsolateApi) => {
    // TODO replace this with native relay ability
    return api.action(request)
  },
}
