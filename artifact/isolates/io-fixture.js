import { Debug } from '@utils'
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
  spawn: {
    description: 'ping the AI',
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
  },
}
export const functions = {
  error: ({ message }) => {
    throw new Error(message)
  },
  spawn: async ({ isolate }) => {
    log('spawn', isolate)
    const { pong } = await spawns(isolate)
    const result = await pong()
    return result
  },
  pong: () => {
    return 'remote pong'
  },
  local: () => {
    return 'local reply'
  },
}
