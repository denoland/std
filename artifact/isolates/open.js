import { isBrowser } from 'npm:wherearewe'

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
  openUrl: ({ url }) => {
    if (!isBrowser) {
      throw new Error('cannot open window unless running in browser')
    }
    globalThis.open(url, '_blank')
  },
}
