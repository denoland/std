import { UnsequencedRequest } from '@/constants.ts'
import { IsolateApi } from '@/constants.ts'

export const api = {
  pierce: {
    type: 'object',
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
export interface Api {
  pierce: (params: { request: UnsequencedRequest }) => Promise<void>
}
export const functions = {
  pierce(params: { request: UnsequencedRequest }, api: IsolateApi) {
    // TODO replace this with native relay ability
    const { request } = params
    return api.action(request)
  },
}
