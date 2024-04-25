import { IsolateApi, PID, print } from '@/constants.ts'
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
   * changed, permitting the user to reprogram their instance of HAL */
  setPromptTarget: (path: string) => Promise<void>
}
export type HalSession = {
  prompt: (params: { text: string }) => Promise<void>
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
    required: ['path'],
    properties: {
      path: {
        type: 'string',
      },
    },
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
}

export const functions = {
  createSession: async (_: object, api: IsolateApi) => {
    const functions = await api.functions<session.Api>('session')

    const { origin } = api
    // TODO allow nested branch names

    // BUT need to name it after the repo base that sent it
    // then create a new incremented senssion name using a prefix
    // create the base if it doesn't exist

    const name = id(origin.source)
    // await api.pidExists()
    log('api pid', name)
    const pid = await functions.create({ name })
    return pid
  },
  resetPromptTarget: async () => {
  },
  setPromptTarget: async (_params: { path: string }) => {
  },
  prompt: async ({ text }: { text: string }, api: IsolateApi) => {
    log('prompt', text)
    // read the default help path
    // if not there, choose the goalie
    // engage the help via a compartment
    const functions = await api.functions('engage-help')
    return functions.engage({ text, help: 'goalie' })
  },
}

const id = (pid: PID) =>
  `${pid.id}-${pid.account}-${pid.repository}_${pid.branches.join('-')}`
