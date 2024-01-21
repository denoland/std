import * as hooks from '../artifact/io-hooks.js'
import assert from 'assert-fast'
import { load } from '../artifact/load-help.js'
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
  engageInBand: engage,
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
  engageInBand: async ({ help: path, text }) => {
    debug('engage:', path)
    const help = await load(path)
    debug(help)

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    debug('found runner:', help.runner)
    // TODO move to an eager vite glob import or a cache
    const { default: runner } = await import(`../runners/${help.runner}.js`)

    return await runner({ path, text })
  },
  engage: async ({ help, text }) => {
    debug('engage:', help)
    // TODO should be able to get my own isolate name inside the isolate
    const { engageInBand } = await hooks.spawns('engage-help')
    return await engageInBand({ help, text })
  },
  continue: async ({ help: path, text, commit }) => {
    debug('continue:', path, commit)
    // this would continue the help, but in the same branch as a previous run
  },
  load: async ({ help }) => {
    debug('load:', help)
    return await load(help)
    // TODO this should load up the functions that would be available to, so the
    // model has more to work with
  },
}

// because engage help is inside of a runner, it can have any format we like
