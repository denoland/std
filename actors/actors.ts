import {
  actorIdRegex,
  addBranches,
  backchatIdRegex,
  colorize,
  Functions,
  getActorId,
  isBaseRepo,
  machineIdRegex,
  pidSchema,
  print,
  RpcOpts,
  SU_ACTOR,
  SU_BACKCHAT,
  ToApiType,
} from '@/constants.ts'
import * as actor from '@/api/isolates/actor.ts'
import { assert, Debug, expect } from '@utils'
import * as session from '../_import-artifact/isolates/session.ts'
import * as machines from '../_import-artifact/isolates/machines.ts'
import { Crypto } from '../api/crypto.ts'
import { z } from 'zod'

const log = Debug('AI:actors')

export const parameters = {
  '@@install': z.object({
    /** The superuser machine id */
    superuser: z.string().regex(machineIdRegex),
  }),
  createActor: z.object({
    actorId: z.string().regex(actorIdRegex),
    machineId: z.string().regex(machineIdRegex),
    backchatId: z.string().regex(backchatIdRegex),
  }).describe(
    'Create a new actor branch and a new backchat branch, as well as writing the machineId to the "machines" branch and pointing it to the actor branch',
  ),
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
  surrender: z.object({
    authProvider: pidSchema,
  }),
  /**
   * Register an auth provider that is allowed to authorize merging actorIds.
   * Can only be called by the installation owner account.
   */
  addAuthProvider: z.object({
    provider: pidSchema,
    name: z.string(),
  }),
}
export const returns = {
  '@@install': z.void(),
  createActor: pidSchema,
  surrender: z.string(),
  addAuthProvider: z.void(),
}
export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  async '@@install'({ superuser }, api) {
    // TODO set ACL on io.json to only run this isolate
    assert(Crypto.assert(superuser), 'invalid superuser: ' + superuser)
    assert(isBaseRepo(api.pid), '@@install not base: ' + print(api.pid))
    log('@@install', print(api.pid))

    const children = await api.lsChildren()
    expect(children, 'repo must have no child branches').toEqual([])

    // TODO make a permissions branch based on the repoid, so it is unique
    await api.updateState((state) => {
      expect(state, 'state must be empty').toEqual({})
      return { superuser, authProviders: {} }
    }, stateSchema)

    // TODO send an api action that wipes the dir and writes a basic commit
    const { create } = await api.functions<session.Api>('session')
    const { createActor } = await api.functions<Api>('actors')

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
  async createActor({ machineId, actorId, backchatId }, api) {
    assert(isBaseRepo(api.pid), 'createActor not base: ' + print(api.pid))
    log('createActor', colorize(machineId), colorize(actorId))

    const opts: RpcOpts = {
      noClose: true,
      branchName: actorId,
    }
    const { backchat } = await api.actions<actor.Api>('actor', opts)
    const pid = await backchat({ backchatId, machineId })

    const target = addBranches(api.pid, 'machines')
    const { upsert } = await api.actions<machines.Api>('machines', { target })
    log('adding machines branch')
    await upsert({ machineId, actorId })
    log('machines branch updated')
    // TODO parallelize
    return pid
  },

  async addAuthProvider({ provider, name }, api) {
    assert(
      isBaseRepo(provider),
      'addAuthProvider not base: ' + print(provider),
    )
    log('addAuthProvider provider', print(provider))
    log('addAuthProvider in', print(api.pid))
    await api.updateState((state) => {
      const next = stateSchema.parse({ ...state })
      if (next.authProviders[name]) {
        throw new Error('Auth provider already exists: ' + name)
      }
      next.authProviders[name] = provider
      return next
    }, stateSchema)
  },

  surrender: async ({ authProvider }, api) => {
    assert(isBaseRepo(api.pid), 'surrender not base: ' + print(api.pid))
    log('surrender', print(api.pid))
    log('surrender authProvider', print(authProvider))
    log('origin', print(api.origin.source))

    const actorId = getActorId(api.origin.source)

    // look up the pointer from the auth provider
    const target = addBranches(authProvider, actorId)

    // TODO use state to replace pointer

    // TODO make this an api function exposed by the auth provider isolate
    const pointer = await api.readJSON('pointer.json', { target })
    log('authPointer', pointer)

    return actorId

    // TODO move every machine in this actor to merge with the baseActorId
  },
}

export const stateSchema = z.object({
  /** The machineId of the superuser */
  superuser: z.string().regex(machineIdRegex),
  authProviders: z.record(pidSchema),
})
