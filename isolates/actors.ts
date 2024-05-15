import {
  getActorId,
  getActorPid,
  getMachineId,
  isBaseRepo,
  IsolateApi,
  machineIdRegex,
  Params,
  PID,
  pidSchema,
  print,
  sessionIdRegex,
} from '@/constants.ts'
import { assert, Debug, equal, expect } from '@utils'
import * as session from './session.ts'
import * as files from './files.ts'
import * as system from './system.ts'

const log = Debug('AI:actors')

export type ActorApi = {
  /** Clones from github, using the github PAT (if any) for the calling machine.
   * Updates the repo.json file in the actor branch to point to the new PID of
   * the clone.
   */
  clone: (params: { repo: string }) => Promise<PID>

  init: (params: { repo: string }) => Promise<{ pid: PID; head: string }>

  /**
   * List all the repos that this Actor has created.
   */
  lsRepos: () => Promise<string[]>
}
export type Admin = {
  createMachineSession: (
    params: { machineId: string; sessionId: string },
  ) => Promise<PID>

  /**
   * Called by an actor, after authorizing, to merge its actorId with the
   * actorId authorized with the given auth provider.
   *
   * For example, in github, the github user id is used to link actorIds
   * together, and the first actorId to pass auth is the stable actorId for that
   * user id, so future requests to merge always merge into that actorId.
   *
   * The operation leaves a record of what auth provider approved what
   * unification and at what commit.
   */
  surrender: (params: { authProvider: PID }) => Promise<void>
  /**
   * Register an auth provider that is allowed to authorize merging actorIds.
   * Can only be called by the installation owner account.
   */
  addAuthProvider: (params: { provider: PID; name: string }) => Promise<void>
}

export type Api = Admin & ActorApi

const repo = {
  type: 'object',
  additionalProperties: false,
  required: ['repo'],
  properties: {
    repo: { type: 'string' },
  },
}

export const api = {
  init: {
    type: 'object',
    additionalProperties: false,
    required: ['repo'],
    properties: {
      repo: { type: 'string' },
      isolate: { type: 'string' },
      params: { type: 'object' },
    },
  },
  rm: {
    type: 'object',
    additionalProperties: false,
    properties: {
      repo: { type: 'string' },
      all: { type: 'boolean', description: 'remove all repos for this actor' },
    },
  },
  lsRepos: {
    description: 'List all the repos that this Actor controls',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  clone: repo,
  addAuthProvider: {
    type: 'object',
    additionalProperties: false,
    required: ['provider', 'name'],
    properties: {
      provider: pidSchema,
      name: { type: 'string' },
    },
  },
  '@@install': {
    type: 'object',
    additionalProperties: false,
    required: ['superuser'],
    properties: {
      superuser: { type: 'string', pattern: machineIdRegex.source },
    },
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
      authProvider: pidSchema,
    },
  },
}

export const functions = {
  /** Used by system provisioning to create a blank app */
  async '@@install'({ superuser }: { superuser: string }, api: IsolateApi) {
    log('@@install', print(api.pid))
    // TODO set ACL on io.json to only run this isolate
    assert(isBaseRepo(api.pid), '@@install not base: ' + print(api.pid))
    const dir = await api.ls('.')
    expect(dir, 'repo must be empty').toEqual(['.io.json'])
    const children = await api.lsChildren()
    assert(children.length === 0, 'repo must have no child branches')

    const config: Config = { superuser, authProviders: {} }
    api.writeJSON('config.json', config)
  },
  async addAuthProvider(
    { provider, name }: { provider: PID; name: string },
    api: IsolateApi,
  ) {
    assert(isBaseRepo(provider), 'addAuthProvider not base: ' + print(provider))
    log('addAuthProvider provider', print(provider))
    log('addAuthProvider in', print(api.pid))
    const config = await api.readJSON<Config>('config.json')
    if (!config.authProviders) {
      if (config.authProviders[name]) {
        throw new Error('Auth provider already exists: ' + name)
      }
    }
    config.authProviders[name] = provider
    api.writeJSON('config.json', config)
  },
  rm: async (
    { repo, all = false }: { repo?: string; all?: boolean },
    api: IsolateApi,
  ) => {
    assertIsActorPid(api)
    const { rm } = await api.actions<system.Api>('system')
    const repos = await readRepos(api)
    if (all) {
      const promises = []
      for (const repo in repos) {
        promises.push(rm({ pid: repos[repo] }))
      }
      await Promise.all(promises)
      api.writeJSON('repos.json', {})
      return true
    }
    assert(repo, 'must specify repo or all')
    if (!(repo in repos)) {
      return false
    }
    const pid = repos[repo]
    log('rm', repo, print(pid), all)

    await rm({ pid })
    delete repos[repo]
    api.writeJSON('repos.json', repos)
    return true
  },
  lsRepos: async (_params: Params, api: IsolateApi) => {
    assertIsActorPid(api)
    const repos = await readRepos(api)
    return Object.keys(repos)
  },
  clone: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IsolateApi,
  ) => {
    assertIsActorPid(api)
    const { repo, isolate, params } = p
    log('clone', repo, isolate, params)

    const repos = await readRepos(api)
    if (repo in repos) {
      throw new Error('Repo already exists: ' + repo)
    }

    const { clone } = await api.actions<system.Api>('system')
    const result = await clone({ repo, isolate, params })
    log('clone result', print(result.pid))

    repos[repo] = result.pid
    api.writeJSON('repos.json', repos)
    return result
  },
  init: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IsolateApi,
  ) => {
    assertIsActorPid(api)

    const { repo, isolate, params } = p
    log('init', repo)

    const repos = await readRepos(api)
    if (repo in repos) {
      throw new Error('Repo already exists: ' + repo)
    }

    const { init } = await api.actions<system.Api>('system')
    const { pid, head } = await init({ repo, isolate, params })
    repos[repo] = pid
    api.writeJSON('repos.json', repos)
    return { pid, head }
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
    assert(isBaseRepo(api.pid), 'surrender not base: ' + print(api.pid))
    log('surrender', print(api.pid))
    log('surrender authProvider', print(params.authProvider))
    log('origin', print(api.origin.source))

    const actorId = getActorId(api.origin.source)
    const _machineId = getMachineId(api.origin.source)

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

    // TODO move every machine in this actor to merge with the baseActorId
  },
}

const addBranch = (pid: PID, branch: string) => {
  return { ...pid, branches: [...pid.branches, branch] }
}

const assertIsActorPid = (api: IsolateApi) => {
  const actorPid = getActorPid(api.pid)
  if (!equal(actorPid, api.pid)) {
    throw new Error('Must be called from Actor branch: ' + print(api.pid))
  }
}
const readRepos = async (api: IsolateApi) => {
  let repos: Repos = {}
  if (await api.exists('repos.json')) {
    repos = await api.readJSON<Repos>('repos.json')
  }
  return repos
}

type Repos = { [repo: string]: PID }
export type Config = {
  superuser: string
  authProviders: { [name: string]: PID }
}
