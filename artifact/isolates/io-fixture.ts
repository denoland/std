import { Debug } from '@utils'
import { IsolateApi } from '@/artifact/constants.ts'
import { PID } from '@/artifact/constants.ts'
const log = Debug('AI:io-fixture')

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
    properties: {},
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
    log('error', message)
    throw new Error(message)
  },
  branch: async (_: object, api: IsolateApi) => {
    log('branch')
    const { pong } = await api.actions('io-fixture')
    const result = await pong({}, { branch: true })
    return result
  },
  compound: async (params: { target?: PID }, api: IsolateApi) => {
    const { target } = params
    log('compound target:', target)
    const { pong } = await api.actions('io-fixture', target)
    const result = await pong({})
    return result
  },
  pong: () => {
    log('pong')
    return 'remote pong'
  },
  local: () => {
    log('local')
    return 'local reply'
  },
}
