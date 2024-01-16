import Debug from 'debug'
const debug = Debug('AI:engage-help')
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
  engage: async ({ help: path }) => {
    debug('engage:', path)
    // ? why can't this function run the help directly ?
    const { default: help } = await import(`../helps/${path}.js`)
    debug(help)
    return 'testing'
  },
}
