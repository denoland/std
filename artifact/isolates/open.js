import { isBrowser } from 'wherearewe'

import Debug from 'debug'
const debug = Debug('AI:io.fixture')

export const api = {
  openUrl: {
    description: 'Opens a URL in the default browser',
    type: 'object',
    additionalProperties: false,
    required: ['url'],
    properties: {
      url: { type: 'string' },
      wait: { type: 'boolean', default: false },
    },
  },
}
export const functions = {
  openUrl: async ({ url }) => {
    debugger
    if (!isBrowser) {
      throw new Error('cannot open window unless running in browser')
    }
    window.open(url, '_blank')
  },
}
