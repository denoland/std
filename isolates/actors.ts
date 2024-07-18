import {
  ActorApi,
  actorIdRegex,
  addBranches,
  backchatIdRegex,
  colorize,
  getActorId,
  IA,
  isActorBranch,
  isBaseRepo,
  machineIdRegex,
  Params,
  PID,
  pidSchema,
  print,
  RpcOpts,
  SU_ACTOR,
  SU_BACKCHAT,
  ThreadArgs,
} from '@/constants.ts'
import { assert, Debug, equal, expect } from '@utils'
import * as backchat from './backchat.ts'
import * as thread from './thread.ts'
import * as session from './session.ts'
import * as files from './files.ts'
import * as system from './system.ts'
import * as machines from './machines.ts'
import { Crypto } from '@/api/web-client-crypto.ts'
export type { ActorApi }
const log = Debug('AI:actors')

export type ActorAdmin = {
  createActor: (
    params: { actorId: string; machineId: string; backchatId: string },
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

export type Api = ActorAdmin & ActorApi

const init = {
  type: 'object',
  additionalProperties: false,
  required: ['repo'],
  properties: {
    repo: { type: 'string' },
    isolate: { type: 'string' },
    params: { type: 'object' },
  },
}

export const api = {
  '@@install': {
    type: 'object',
    additionalProperties: false,
    properties: {
      superuser: { type: 'string', pattern: machineIdRegex.source },
    },
  },
  createActor: {
    type: 'object',
    description:
      'Create a new actor branch and a new backchat branch, as well as writing the machineId to the "machines" branch and pointing it to the actor branch',
    additionalProperties: false,
    required: ['actorId', 'machineId', 'backchatId'],
    properties: {
      machineId: { type: 'string', pattern: machineIdRegex.source },
      actorId: { type: 'string', pattern: actorIdRegex.source },
      backchatId: { type: 'string', pattern: backchatIdRegex.source },
    },
  },
  backchat: {
    type: 'object',
    description:
      'Create a new backchat branch.  Optionally if machineId is given, will add to the actors list of machines, which is used during createActor function',
    required: ['backchatId'],
    properties: {
      backchatId: {
        type: 'string',
        description:
          'The backchat id to create.  If the backchat id already exists, an error will be thrown',
      },
      machineId: {
        type: 'string',
        description:
          'The machine id to add to the actors list of machines.  If the machine id already exists, an error will be thrown',
      },
    },
    additionalProperties: false,
  },
  thread: {
    type: 'object',
    additionalProperties: false,
    required: ['agentPath', 'threadId'],
    properties: {
      agentPath: { type: 'string' },
      threadId: { type: 'string' },
    },
  },
  init,
  clone: init,
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
  addAuthProvider: {
    type: 'object',
    additionalProperties: false,
    required: ['provider', 'name'],
    properties: {
      provider: pidSchema,
      name: { type: 'string' },
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
  async '@@install'(p: { superuser: string }, api: IA) {
    // TODO set ACL on io.json to only run this isolate
    const { superuser } = p
    assert(Crypto.assert(superuser), 'invalid superuser: ' + superuser)
    assert(isBaseRepo(api.pid), '@@install not base: ' + print(api.pid))
    log('@@install', print(api.pid))

    const dir = await api.ls()
    expect(dir).not.toContain('config.json')
    const children = await api.lsChildren()
    expect(children, 'repo must have no child branches').toEqual([])

    // TODO make a permissions branch based on the repoid, so it is unique
    const config: AdminConfig = { superuser, authProviders: {} }
    api.writeJSON('config.json', config)

    // TODO send an api action that wipes the dir and writes a basic commit
    const { create } = await api.functions<session.Api>('session')
    const { createActor } = await api.functions<ActorAdmin>('actors')

    log('creating machine branch')
    await create({ name: 'machines' })

    log('creating superuser actor')
    const pid = await createActor({
      machineId: superuser,
      actorId: SU_ACTOR,
      backchatId: SU_BACKCHAT,
    })
    log('@@install complete', print(pid))
  },
  async createActor(
    p: { machineId: string; actorId: string; backchatId: string },
    api: IA,
  ) {
    assert(isBaseRepo(api.pid), 'createActor not base: ' + print(api.pid))
    const { machineId, actorId, backchatId } = p
    assert(machineIdRegex.test(machineId), 'machineId: ' + machineId)
    assert(actorIdRegex.test(actorId), 'actorId: ' + actorId)
    assert(backchatIdRegex.test(backchatId), 'backchatId: ' + backchatId)
    log('createActor', colorize(p.machineId), colorize(p.actorId))

    const opts: RpcOpts = {
      noClose: true,
      branchName: actorId,
      deletes: ['config.json'],
    }
    const { backchat } = await api.actions<ActorApi>('actors', opts)
    const pid = await backchat({ backchatId, machineId })

    const target = addBranches(api.pid, 'machines')
    const { upsert } = await api.actions<machines.Api>('machines', { target })
    log('adding machines branch')
    await upsert({ machineId, actorId })
    log('machines branch updated')
    // TODO parallelize
    return pid
  },
  async backchat(p: { backchatId: string; machineId?: string }, api: IA) {
    assert(isActorBranch(api.pid), 'Not actor branch: ' + print(api.pid))

    log('backchat', print(api.pid))
    const { backchatId, machineId } = p
    const isNewActor = !!machineId
    if (isNewActor) {
      const config: ActorConfig = {
        machines: { [machineId]: { access: [] } },
        repos: {},
      }
      api.writeJSON('config.json', config)
    }
    const opts: RpcOpts = {
      noClose: true,
      branchName: backchatId,
      deletes: ['config.json'],
    }
    const { create } = await api.actions<backchat.Api>('backchat', opts)
    // TODO set permissions on .io.json
    await create()
    // TODO optionally start a default thread
    const pid = addBranches(api.pid, backchatId)
    log('backchat pid', print(pid))
    return pid
  },
  async thread({ agentPath, threadId }: ThreadArgs, api: IA) {
    const opts = { branchName: threadId, noClose: true }
    const actions = await api.actions<thread.Api>('thread', opts)
    const pid = await actions.start({ agentPath, threadId })
    return pid
  },
  async addAuthProvider(
    { provider, name }: { provider: PID; name: string },
    api: IA,
  ) {
    assert(isBaseRepo(provider), 'addAuthProvider not base: ' + print(provider))
    log('addAuthProvider provider', print(provider))
    log('addAuthProvider in', print(api.pid))
    const config = await api.readJSON<AdminConfig>('config.json')
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
    api: IA,
  ) => {
    assert(isActorBranch(api.pid), 'rm not actor: ' + print(api.pid))
    log('rm', repo, all)

    const { rm } = await api.actions<system.Api>('system')
    const config = await readConfig(api)
    if (all) {
      const promises = []
      for (const repo in config.repos) {
        promises.push(rm({ pid: config.repos[repo] }))
      }
      await Promise.all(promises)
      const configCheck = await readConfig(api)
      assert(equal(config.repos, configCheck), 'config changed')
      config.repos = {}
      api.writeJSON('config.json', config)
      return true
    }
    assert(repo, 'must specify repo or all')
    if (!(repo in config.repos)) {
      return false
    }
    const pid = config.repos[repo]
    log('rm', repo, print(pid), all)

    await rm({ pid })
    const configCheck = await readConfig(api)
    assert(equal(config, configCheck), 'config changed')
    delete config.repos[repo]
    api.writeJSON('config.json', config)
    return true
  },
  lsRepos: async (_params: Params, api: IA) => {
    assert(isActorBranch(api.pid), 'lsRepos not actor: ' + print(api.pid))
    const config = await readConfig(api)
    return Object.keys(config.repos)
  },
  clone: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IA,
  ) => {
    assert(isActorBranch(api.pid), 'clone not actor: ' + print(api.pid))
    const { repo, isolate, params } = p
    log('clone', p)

    let config = await readConfig(api, repo)

    const { clone } = await api.actions<system.Api>('system')
    const result = await clone({ repo, isolate, params })
    log('clone result', print(result.pid))

    config = await readConfig(api, repo)
    config.repos[repo] = result.pid
    api.writeJSON('config.json', config)
    log('clone wrote repos:', Object.keys(config.repos))
    return result
  },
  init: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IA,
  ) => {
    assert(isActorBranch(api.pid), 'init not actor: ' + print(api.pid))

    const { repo, isolate, params } = p
    log('init', repo)

    let config = await readConfig(api, repo)

    const { init } = await api.actions<system.Api>('system')
    const { pid, head } = await init({ repo, isolate, params })

    config = await readConfig(api, repo)
    config.repos[repo] = pid
    api.writeJSON('config.json', config)
    log('init wrote repos:', Object.keys(config.repos))
    return { pid, head }
  },
  surrender: async (params: { authProvider: PID }, api: IA) => {
    assert(isBaseRepo(api.pid), 'surrender not base: ' + print(api.pid))
    log('surrender', print(api.pid))
    log('surrender authProvider', print(params.authProvider))
    log('origin', print(api.origin.source))

    const actorId = getActorId(api.origin.source)

    // ? is this allowed to happen ?

    // look up the pointer from the auth provider
    const target = addBranches(params.authProvider, actorId)
    // TODO make this an api function exposed by the auth provider isolate
    const authActor = await api.actions<files.Api>('files', { target })
    // TODO implement readJSON<type> for remote reads
    const pointerString = await authActor.read({ path: 'pointer.json' })
    const pointer = JSON.parse(pointerString)
    log('authPointer', pointer)

    if (pointer.actorId === actorId) {
      return actorId
    }

    // TODO move every machine in this actor to merge with the baseActorId
  },
}

const readConfig = async (api: IA, checkRepo?: string) => {
  let config: ActorConfig = { repos: {}, machines: {} }
  if (await api.exists('config.json')) {
    config = await api.readJSON<ActorConfig>('config.json')
  }
  if (checkRepo && checkRepo in config.repos) {
    throw new Error('Repo already exists: ' + checkRepo)
  }
  return config
}

export type ActorConfig = {
  repos: { [repo: string]: PID }
  machines: {
    [machineId: string]: {
      /** Log when a machine does something */
      access: []
    }
  }
}
export type AdminConfig = {
  superuser: string
  authProviders: { [name: string]: PID }
}
