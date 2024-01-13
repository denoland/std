import { actions } from '../exec/io-hooks'
export const api = {
  ping: {
    description: 'ping the AI',
    type: 'object',
    properties: {},
  },
  pong: {
    description: 'ping the AI',
    type: 'object',
    properties: {},
  },
}
export const functions = {
  ping: async () => {
    const { pong } = await actions('/pong.io.json')
    const result = await pong()
    return result
  },
  pong: async () => {
    return 'remote pong'
  },
}
