import { assert, Debug } from '@utils'
import { IsolateApi } from '@/constants.ts'
import { Help, RUNNERS } from '@/constants.ts'
import * as loadHelp from '@/isolates/load-help.ts'
import * as promptIsolate from '@/isolates/ai-prompt.ts'
import * as injectorIsolate from '@/isolates/ai-prompt-injector.ts'
const log = Debug('AI:isolates:engage-help')

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
export interface Api {
  engage: (params: { help: string; text: string }) => Promise<unknown>
}
export const functions = {
  engage: async (params: { help: string; text: string }, api: IsolateApi) => {
    const { help: path, text } = params
    log('engage:', path)
    const { load } = await api.functions<loadHelp.Api>('load-help')
    const help: Help = await load({ help: path })

    const { runner = RUNNERS.CHAT } = help
    const isValid = runner === RUNNERS.CHAT || runner === RUNNERS.INJECTOR
    assert(isValid, `no runner: ${help.runner}`)
    log('found runner string:', runner)

    const isolate = runner === RUNNERS.CHAT ? promptIsolate : injectorIsolate

    await isolate.functions.prompt({ help, text }, api)
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
    // this should be handled at the process level, not internally
  },
}
