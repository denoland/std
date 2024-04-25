import { IsolateApi, PID } from '@/constants.ts'
import * as session from './session.ts'
import { Debug } from '@utils'
const log = Debug('AI:hal')

export type HalBase = {
  /**  */
  createSession: () => Promise<PID>
  /** If the user has changed what help is the prompt target, this will reset it
   * back to the default */
  resetPromptTarget: () => Promise<void>
  /** Allows the help that gets called with the text from prompt calls to be
   * changed, permitting the user to reprogram their instance of HAL.  The
   * provided help name must be a valid help file */
  setPromptTarget: (params: { help: string }) => Promise<void>
}
export type HalSession = {
  prompt: (params: { text: string }) => Promise<void>
  resetSession: () => Promise<void>
}

export type Api = HalBase & HalSession

export const api = {
  createSession: {
    type: 'object',
    additionalProperties: false,
  },
  resetPromptTarget: {
    type: 'object',
    additionalProperties: false,
  },
  setPromptTarget: {
    type: 'object',
    required: ['help'],
    properties: { help: { type: 'string' } },
    additionalProperties: false,
  },
  prompt: {
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
      },
    },
    additionalProperties: false,
  },
  resetSession: {
    type: 'object',
    additionalProperties: false,
  },
}

export const ENTRY_HELP_FILE = 'entry.json'
export type EntryHelpFile = {
  help: string
}

export const functions = {
  createSession: async (_: object, api: IsolateApi) => {
    const session = await api.functions<session.Api>('session')

    const { origin } = api
    // TODO allow nested branch names

    // BUT need to name it after the repo base that sent it
    // then create a new incremented senssion name using a prefix
    // create the base if it doesn't exist

    const name = id(origin.source)
    // await api.pidExists()
    log('api pid', name)
    const pid = await session.create({ name })
    return pid
  },
  resetPromptTarget: (_: object, api: IsolateApi) => {
    api.delete(ENTRY_HELP_FILE)
  },
  setPromptTarget: async ({ help }: { help: string }, api: IsolateApi) => {
    const { load } = await api.functions('load-help')
    await load({ help })
    api.writeJSON(ENTRY_HELP_FILE, { help })
    log('setPromptTarget', help)
  },
  prompt: async ({ text }: { text: string }, api: IsolateApi) => {
    log('prompt', text)
    let help = 'goalie'
    if (await api.exists(ENTRY_HELP_FILE)) {
      const redirect = await api.readJSON<EntryHelpFile>(ENTRY_HELP_FILE)
      help = redirect.help
      log('found entry file', help)
    }
    const functions = await api.functions('engage-help')
    return functions.engage({ text, help })
  },
  resetSession: (_: object, api: IsolateApi) => {
    api.delete('session.json')
  },
}

const id = (pid: PID) =>
  `${pid.id}-${pid.account}-${pid.repository}_${pid.branches[0]}`
