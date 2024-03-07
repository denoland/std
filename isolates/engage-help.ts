import { assert, Debug } from '@utils'
const log = Debug('AI:isolates:engage-help')
import runners from '../runners/index.ts'
import { IsolateApi } from '@/constants.ts'
import { Help } from '@/constants.ts'

export const api = {
  engage: {
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
  },
}

export const functions = {
  engage: async (params: { help: string; text: string }, api: IsolateApi) => {
    const { help: path, text } = params
    log('engage:', path)
    const { load } = await api.functions('load-help')
    const help: Help = await load({ help: path })

    assert(typeof help.runner === 'string', `no runner: ${help.runner}`)
    log('found runner string:', help.runner)
    const runner = runners[help.runner]
    assert(runner, `no runner: ${help.runner}`)

    const result = await runner({ help, text }, api)
    log('result:', result)
    return result
  },
  continue: (
    { help: path, text, commit }: {
      help: string
      text: string
      commit: string
    },
  ) => {
    log('continue:', path, text, commit)
    // this would continue the help, but in the same branch as a previous run
  },
}
