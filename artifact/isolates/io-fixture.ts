import { Debug } from '@utils'
import { IsolateApi } from '@/artifact/constants.ts'
import { PID } from '@/artifact/constants.ts'
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
  compound: {
    description: 'call another function',
    type: 'object',
    additionalProperties: false,
    properties: { target: { type: 'object' } },
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
  branch: async ({ isolate = 'io-fixture' }, api: IsolateApi) => {
    log('branch', isolate)
    const { pong } = await api.actions(isolate)
    const result = await pong({}, { branch: true })
    return result
  },
  compound: async (params: { target?: PID }, api: IsolateApi) => {
    log('compound')
    const { target } = params
    const { pong } = await api.actions('io-fixture', target)
    const result = await pong({})
    return result
  },
  pong: () => {
    return 'remote pong'
  },
  local: () => {
    return 'local reply'
  },
}
