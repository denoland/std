import { spawns } from '../artifact/io-hooks'
import Debug from 'debug'
const debug = Debug('AI:io.fixture')

export const api = {
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
  spawn: async ({ isolate }) => {
    debug('spawn', isolate)
    const { pong } = await spawns(isolate)
    const result = await pong()
    return result
  },
  pong: async () => {
    return 'remote pong'
  },
  local: async () => {
    return 'local reply'
  },
}
