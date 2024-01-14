import Debug from 'debug'
const debug = Debug('AI:help-runner')
export const api = {
  engage: {
    description: 'engage the help',
    type: 'object',
    properties: {
      helpPath: {
        description: 'the path to the help',
        type: 'string',
      },
    },
  },
}

export const functions = {
  engage: async ({ helpPath }, config) => {
    debug('engage', helpPath)
  },
}
