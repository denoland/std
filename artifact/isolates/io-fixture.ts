import { Debug } from '@utils'
import { IsolateApi } from '@/artifact/constants.ts'
const log = Debug('AI:io.fixture')

export const api = {
  error: {
    description: 'throw an error',
    type: 'object',
    additionalProperties: false,
    properties: {
      message: { type: 'string' },
    },
  },
  branch: {
    description: 'make a new branch',
    type: 'object',
    additionalProperties: false,
    properties: {
      isolate: { type: 'string' },
    },
  },
  pong: {
    description: 'ping the AI',
    type: 'object',
    properties: {},
  },
  local: {
    description: 'ping locally',
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}
export const functions = {
  error: ({ message }: { message: string }) => {
    throw new Error(message)
  },
  branch: async ({ isolate }: { isolate: string }, api: IsolateApi) => {
    log('branch', isolate)
    const { pong } = await api.actions(isolate)
    const result = await pong({}, { branch: true })
    return result
  },
  pong: () => {
    return 'remote pong'
  },
  local: () => {
    return 'local reply'
  },
}
