import {
  ActorApi,
  getActorId,
  getMachineId,
  isBaseRepo,
  IsolateApi,
  machineIdRegex,
  Params,
  PID,
  print,
  sessionIdRegex,
} from '@/constants.ts'
import { assert, Debug, expect } from '@utils'
import * as session from './session.ts'
import * as files from './files.ts'
import { pid } from './repo.ts'

const log = Debug('AI:actors')

export type { ActorApi }
export type Admin = {
  /**
   * Register an auth provider that is allowed to authorize merging actorIds.
   * Can only be called by the installation owner account.
   */
  addAuthProvider: (params: { provider: PID }) => Promise<void>
}

export type Api = Admin & ActorApi

export const api = {
  addAuthProvider: {
    type: 'object',
    additionalProperties: false,
    required: ['provider'],
    properties: {
      provider: { $ref: 'PID' },
    },
  },
  '@@install': {
    type: 'object',
    additionalProperties: false,
  },
  createMachineSession: {
    type: 'object',
    additionalProperties: false,
    required: ['machineId', 'sessionId'],
    properties: {
      machineId: { type: 'string', pattern: machineIdRegex.source },
      sessionId: { type: 'string', pattern: sessionIdRegex.source },
    },
  },
  createSession: {
    type: 'object',
    additionalProperties: false,
    required: ['sessionId'],
    properties: {
      sessionId: { type: 'string', pattern: sessionIdRegex.source },
    },
  },
  surrender: {
    type: 'object',
    additionalProperties: false,
    required: ['authProvider'],
    properties: {
      authProvider: pid.properties.pid,
    },
  },
}

export const functions = {
  async addAuthProvider({ provider }: { provider: PID }, api: IsolateApi) {
    log('addAuthProvider', provider)
  },

  /** Used by system provisioning to create a blank app */
  async '@@install'(_: Params, api: IsolateApi) {
    // TODO set ACL on io.json
    // TODO create basic folder structure
    const dir = await api.ls('.')
    expect(dir, 'repo must be empty').toEqual(['.io.json'])
    const children = await api.lsChildren()
    assert(children.length === 0, 'repo must have no child branches')

    // TODO add some config to lock down this repo to only run this isolate
  },

  async createMachineSession(
    { machineId, sessionId }: { machineId: string; sessionId: string },
    api: IsolateApi,
  ) {
    if (api.pid.branches.length > 1) {
      throw new Error('Actor chain must be a base chain')
    }
    const base = await api.actions<session.Api>('session', api.pid)
    const actorId = machineId
    const actorPid = await base.create({ name: actorId })
    const actor = await api.actions<session.Api>('session', actorPid)
    const machinePid = await actor.create({ name: machineId })
    const machine = await api.actions<session.Api>('session', machinePid)
    const sessionPid = await machine.create({ name: sessionId })
    log('createMachineSession', print(sessionPid))
    return sessionPid
  },
  async createSession({ sessionId }: { sessionId: string }, api: IsolateApi) {
    const branches = [...api.pid.branches]
    branches.pop()
    const machinePid = { ...api.pid, branches }
    const machine = await api.actions<session.Api>('session', machinePid)
    const sessionPid = await machine.create({ name: sessionId })
    log('createSession', print(sessionPid))
    return sessionPid
  },
  surrender: async (params: { authProvider: PID }, api: IsolateApi) => {
    assert(isBaseRepo(api.pid), 'not base: ' + print(api.pid))
    log('surrender', print(api.pid))
    log('surrender authProvider', print(params.authProvider))
    log('origin', print(api.origin.source))

    const actorId = getActorId(api.origin.source)
    const machineId = getMachineId(api.origin.source)

    // ? is this allowed to happen ?

    // look up the pointer from the auth provider
    const authActorPid = addBranch(params.authProvider, actorId)
    const authActor = await api.actions<files.Api>('files', authActorPid)
    // TODO implement readJSON<type> for remote reads
    const pointerString = await authActor.read({ path: 'pointer.json' })
    const pointer = JSON.parse(pointerString)
    log('authPointer', pointer)

    const { baseActorId } = pointer
    if (baseActorId === actorId) {
      return actorId
    }

    // move every machine in this actor to merge with the baseActorId
  },
}

const addBranch = (pid: PID, branch: string) => {
  return { ...pid, branches: [...pid.branches, branch] }
}
