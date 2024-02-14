import { assert } from 'std/assert/mod.ts'
import { Debug } from '@utils'
const log = Debug('AI:isolates:engage-help')
import runners from '../runners/index.ts'

const engage = {
  description: 'engage the help',
  type: 'object',
  additionalProperties: false,
  required: ['help', 'text'],
  properties: {
    help: {
      description: 'the name of the help',
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
}

export const functions = {
  engageInBand: async ({ help: path, text }, api) => {
    log('engage:', path)
    const { load } = await api.functions('load-help')
    const help = await load({ help: path })
    console.log(help)

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    log('found runner string:', help.runner, runners)
    assert(runners[help.runner], `no runner: ${help.runner}`)
    const { default: runner } = runners[help.runner]

    return await runner({ help, text }, api)
  },
  engage: async ({ help, text }) => {
    log('engage:', help)
    // TODO should be able to get my own isolate name inside the isolate
    const { engageInBand } = await hooks.spawns('engage-help')
    return await engageInBand({ help, text })
  },
  continue: async ({ help: path, text, commit }) => {
    log('continue:', path, commit)
    // this would continue the help, but in the same branch as a previous run
  },
}

// because engage help is inside of a runner, it can have any format we like
