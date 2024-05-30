import {
  ArtifactTerminal,
  isBaseRepo,
  IsolateApi,
  PID,
  print,
  Provisioner,
} from '@/constants.ts'
import { Debug } from '@utils'
import { assert } from '@std/assert'
const log = Debug('AI:hal')

export type Api = {
  prompt: (params: { text: string }) => Promise<void>
  resetSession: () => Promise<void>

  /** If the user has changed what help is the prompt target, this will reset it
   * back to the default */
  resetPromptTarget: () => Promise<void>

  /** Allows the help that gets called with the text from prompt calls to be
   * changed, permitting the user to reprogram their instance of HAL.  The
   * provided help name must be a valid help file */
  setPromptTarget: (params: { help: string }) => Promise<void>

  /**
   * Merges the changes made in this branch up to the actor branch so that all
   * new sessions will start using the commit in this branch.
   */
  mergeUpstream: () => Promise<void>
  /**
   * Based on the incoming machineId, lists the available sessions.   If this is
   * the anonymous user, we list only the sessions for this machineId, else we
   * list all the sessions for the authenticated user.
   */
  listSessions: () => Promise<PID[]>

  /**
   * List all the actors that currently have sessions with HAL
   */
  listActors: () => Promise<PID[]>

  /**
   * HAL checks if the machineId is part of the sending authenticated Actor.  If
   * it is, and if there is an anonymous actor for this machineId, it moves all
   * the sessions to the authenticated actor then deletes the anonymous actor
   * branch.
   *
   * This should be called after a machine has completed the oauth loop.
   */
  surrenderMachine: (params: { machineId: string }) => Promise<void>
}

export const api = {
  '@@install': {
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

const DEFAULT_HELP = 'hal-v0.2'

export const functions = {
  '@@install': async (_: object, api: IsolateApi) => {
    assert(isBaseRepo(api.pid), '@@install not base: ' + print(api.pid))
    log('install')
    // TODO store a link to the identity chain
    // TODO set permissions
    await functions.resetPromptTarget({}, api)
  },
  resetPromptTarget: (_: object, api: IsolateApi) => {
    return functions.setPromptTarget({ help: DEFAULT_HELP }, api)
  },
  setPromptTarget: async ({ help }: { help: string }, api: IsolateApi) => {
    try {
      const { load } = await api.functions('load-help')
      await load({ help })
    } catch (_) {
      throw new Error('Invalid help file: ' + help)
    }
    api.writeJSON(ENTRY_HELP_FILE, { help })
    log('setPromptTarget', help)
  },
  prompt: async ({ text }: { text: string }, api: IsolateApi) => {
    log('prompt', text)
    if (!await api.exists(ENTRY_HELP_FILE)) {
      await functions.resetPromptTarget({}, api)
    }
    const entry = await api.readJSON<EntryHelpFile>(ENTRY_HELP_FILE)
    const help = entry.help
    log('found entry file', help)

    const { engage } = await api.functions('engage-help')
    return engage({ help, text })
  },
  resetSession: (_: object, api: IsolateApi) => {
    api.delete('session.json')
  },
}

export const init: Provisioner = async (superTerminal: ArtifactTerminal) => {
  log('init terminal pid', print(superTerminal.pid))
  const { pid } = await superTerminal.clone({
    repo: 'dreamcatcher-tech/HAL',
    isolate: 'hal',
  })
  log('HAL pid', print(pid))
}
