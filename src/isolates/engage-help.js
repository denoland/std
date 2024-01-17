import assert from 'assert-fast'
import loader from '../artifact/load-help.js'
import Debug from 'debug'
const debug = Debug('AI:engage-help')
export const api = {
  engage: {
    description: 'engage the help',
    type: 'object',
    additionalProperties: false,
    required: ['help', 'text'],
    properties: {
      help: {
        description: 'the path to the help',
        type: 'string',
      },
      text: {
        description: 'the text to pass to the help runner',
        type: 'string',
      },
    },
  },
}

export const functions = {
  engage: async ({ help: path, text }) => {
    debug('engage:', path)
    const help = await loader(path)
    debug(help)

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    debug('found runner isolate:', help.runner)
    const { default: runner } = await import(`../runners/${help.runner}.js`)

    return await runner({ help, text })
  },
}

// because engage help is inside of a runner, it can have any format we like
