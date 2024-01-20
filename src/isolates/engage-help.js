import * as hooks from '../artifact/io-hooks.js'
import assert from 'assert-fast'
import loadHelp from '../artifact/load-help.js'
import Debug from 'debug'
const debug = Debug('AI:engage-help')
const engage = {
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
}
export const api = {
  engage,
  engageBranch: engage,
  load: {
    description: 'load the help',
    type: 'object',
    additionalProperties: false,
    required: ['help'],
    properties: {
      help: {
        description: 'the path to the help',
        type: 'string',
      },
    },
  },
}

export const functions = {
  engage: async ({ help: path, text }) => {
    debug('engage:', path)
    const help = await loadHelp(path)
    debug(help)

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    debug('found runner:', help.runner)
    const { default: runner } = await import(`../runners/${help.runner}.js`)

    return await runner({ path, text })
  },
  // TODO swap the defaultness around - branch should be the default call
  engageBranch: async ({ help, text }) => {
    debug('engageBranch:', help)
    // TODO should be able to get my own isolate name inside the isolate
    const { engage } = await hooks.spawns('engage-help')
    return await engage({ help, text })
    // this would engage the help, but in a new branch
  },
  continue: async ({ help: path, text, commit }) => {
    debug('continue:', path, commit)
    // this would continue the help, but in the same branch as a previous run
  },
  load: async ({ help }) => {
    debug('load:', help)
    return await loadHelp(help)
    // TODO this should load up the functions that would be available to, so the
    // model has more to work with
  },
}

// because engage help is inside of a runner, it can have any format we like
