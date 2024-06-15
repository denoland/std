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
  command: {
    ...engage,
    description:
      'Branch and engage, without interacting with the user, returning the result to the caller once finished',
  },
  help: {
    ...engage,
    description:
      'Branch and engage, interacting with the user, returning the result to the caller once finished',
  },
  agent: {
    ...engage,
    description:
      'Branch and engage, interacting with the user, never finishing and never returning unless explicitly told to',
  },
}
export interface Api {
  engage: (params: { help: string; text: string }) => Promise<unknown>
  command: (params: { help: string; text: string }) => Promise<unknown>
  help: (params: { help: string; text: string }) => Promise<unknown>
  agent: (params: { help: string; text: string }) => Promise<unknown>
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
  async command(p: { help: string; text: string }, api: IsolateApi) {
    const { engageNew } = await api.actions('engage-help')
    const prefix = `command_${p.help}`
    // how do we know what is the commit that just returned ?
    const result = await engageNew(p, { prefix })
    return result
    // while waiting, we want to write the commit of the branch down
    // so we need a guaranteed name
  },
  async help(p: { help: string; text: string }, api: IsolateApi) {
    // TODO make this end only with a specific tool call
    // else it is meant to be a discussion with the user
    const { engageNew } = await api.actions('engage-help')
    const prefix = `help_${p.help}`
    return await engageNew(p, { prefix })
  },
  async agent(p: { help: string; text: string }, api: IsolateApi) {
    const { engageNew } = await api.actions('engage-help')
    const prefix = `agent_${p.help}`
    return await engageNew(p, { prefix, noClose: true })
  },
}
