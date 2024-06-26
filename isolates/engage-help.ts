import { assert, Debug } from '@utils'
import { rm } from '@/isolates/ai-session-utils.ts'
import { IsolateApi } from '@/constants.ts'
import { Help, RUNNERS } from '@/constants.ts'
import * as loadHelp from '@/isolates/load-help.ts'
import * as prompt from '@/isolates/ai-prompt.ts'
import * as promptInjector from '@/isolates/ai-prompt-injector.ts'
const log = Debug('AI:engage-help')

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
      description: 'the text to pass to the help runner as the prompt',
      type: 'string',
    },
  },
}
export const api = {
  engage,
  engageNew: { ...engage, description: 'Blank the session file on start' },
}
export interface Api {
  engage: (params: { help: string; text: string }) => Promise<unknown>
  engageNew: (
    params: { help: string; text: string },
    { branchName }: { branchName: string },
  ) => Promise<unknown>
}
export const functions = {
  engage: async (p: { help: string; text: string }, api: IsolateApi) => {
    const { help: path, text } = p
    log('engage:', path)
    const { load } = await api.functions<loadHelp.Api>('load-help')
    const help: Help = await load({ help: path })

    const { runner = RUNNERS.CHAT } = help
    const isValid = runner === RUNNERS.CHAT || runner === RUNNERS.INJECTOR
    assert(isValid, `no runner: ${help.runner}`)
    log('found runner string:', runner)

    const isolate = runner === RUNNERS.CHAT ? prompt : promptInjector

    return await isolate.functions.prompt({ help, text }, api)
  },
  engageNew: (p: { help: string; text: string }, api: IsolateApi) => {
    rm(api)
    return functions.engage(p, api)
  },
}
