import * as Actors from '../isolates/actors.ts'
import {
  ArtifactSession,
  colorize,
  isBaseRepo,
  IsolateApi,
  PID,
  pidSchema,
  print,
} from '@/constants.ts'
import type { Tokens } from '@deno/kv-oauth'
import { Debug } from '@utils'
import { assert } from '@std/assert'
import * as files from './files.ts'
const log = Debug('AI:github')

export type Admin = {
  /**
   * Register an attempt to do the oauth loop, so that when the browser comes
   * back successfully, we can bind its PAT to the machine public key.
   * Recommended validity period is 10 minutes.
   * The actorId must have only one machine child, and must be unauthenticated
   * with the github provider.
   */
  registerAttempt: (
    params: { actorId: string; authSessionId: string },
  ) => Promise<void>

  /**
   * Only allowed for the installation owner / superuser.
   * Requires that a sessionId be active and valid.
   * Looks up the sessionId from the stored registered attempts.
   * Makes a request to github to get the userId.
   *
   * Merges in the actorId to the primary actorId given by the userId, or
   * creates the primary mapping using the current actorId if none exists.
   */
  authorize: (
    params: { authSessionId: string; tokens: Tokens; githubUserId: string },
  ) => Promise<void>
}
export type Actor = {
  /**
   * Deletes the record of the machineId from the actorId.
   * ActorId and authorization is determined from the PID of the caller.
   */
  signout(params: { machineId: string }): Promise<void>
}
export type Api = Admin & Actor

export type Selectors = {
  /**
   * Given a pid, read out the actorId
   */
  readActorId: (params: { pid: PID }) => Promise<string>

  /** Checks for any blacklisted keys */
  isAcceptable: (params: { machineId: string }) => Promise<boolean>

  isAuthorized: (
    params: { machineId: string; actorId: string },
  ) => Promise<boolean>
}

export const api = {
  '@@install': {
    type: 'object',
    additionalProperties: false,
    required: ['homeAddress'],
    properties: { homeAddress: pidSchema },
  },
  registerAttempt: {
    type: 'object',
    additionalProperties: false,
    required: ['actorId', 'authSessionId'],
    properties: {
      actorId: { type: 'string' },
      authSessionId: { type: 'string' },
    },
  },
  authorize: {
    type: 'object',
    additionalProperties: false,
    required: ['authSessionId', 'tokens', 'githubUserId'],
    properties: {
      authSessionId: { type: 'string' },
      tokens: {
        type: 'object',
        required: ['accessToken', 'tokenType'],
        properties: {
          accessToken: { type: 'string' },
          tokenType: { type: 'string' },
        },
      },
      githubUserId: { type: 'string' },
    },
  },
}

export const functions = {
  '@@install': (params: { homeAddress: PID }, api: IsolateApi) => {
    log('install with homeAddress:', print(params.homeAddress))
    assert(isBaseRepo(api.pid), '@@install not base: ' + print(api.pid))
    api.writeJSON('config.json', { homeAddress: params.homeAddress })
  },
  registerAttempt: (
    params: { actorId: string; authSessionId: string },
    api: IsolateApi,
  ) => {
    log('registerAttempt', colorize(params.actorId))
    assert(isBaseRepo(api.pid), 'registerAttempt not base: ' + print(api.pid))

    // TODO use a branch to store the authsession info

    // should be able to get the api of the remote chain and treat it like local
    // api
    // api should be the same inside isolate, as outside artifact, as in a
    // remote chain

    const filename = 'auth-' + params.authSessionId + '.json'
    api.writeJSON(filename, params.actorId)
  },
  authorize: async (
    params: { authSessionId: string; tokens: Tokens; githubUserId: string },
    api: IsolateApi,
  ) => {
    assert(isBaseRepo(api.pid), 'authorize not base: ' + print(api.pid))
    const { authSessionId, tokens, githubUserId } = params
    log('authorize', authSessionId, githubUserId)

    const authFilename = 'auth-' + authSessionId + '.json'
    if (!api.exists(authFilename)) {
      throw new Error('authSessionId not found: ' + authSessionId)
    }
    const actorId = await api.readJSON<string>(authFilename)
    log('actorId', colorize(actorId))
    api.delete(authFilename)

    const githubPid = {
      ...api.pid,
      branches: [...api.pid.branches, githubUserId],
    }
    const files = await api.actions<files.Api>('files')
    const path = 'credentials.json'
    let credentials: Credentials

    if (await api.isChild(githubPid)) {
      // TODO make the api able to be focused remotely
      const { read, write } = await api.actions<files.Api>('files', githubPid)
      const string = await read({ path })
      credentials = JSON.parse(string)
      credentials.tokens[actorId] = tokens
      await write({ path, content: JSON.stringify(credentials) })
    } else {
      credentials = {
        baseActorId: actorId,
        githubUserId,
        tokens: { [actorId]: tokens },
      }
      log('create branch', print(githubPid))
      await files.write(
        { path, content: JSON.stringify(credentials) },
        { noClose: true, branchName: githubUserId },
      )
    }

    // TODO add some info about the PAT
    const pointer: ActorPointer = { baseActorId: actorId, githubUserId }
    const branchName = actorId
    const actorPid = { ...api.pid, branches: [...api.pid.branches, branchName] }
    if (await api.isChild(actorPid)) {
      throw new Error('actorId already exists: ' + print(actorPid))
    }
    const filename = 'pointer.json'
    await files.write(
      { path: filename, content: JSON.stringify(pointer) },
      { noClose: true, branchName: actorId },
    )
    log('actorPid', print(actorPid))
  },
}
type Credentials = {
  baseActorId: string
  githubUserId: string
  tokens: {
    [machineId: string]: Tokens
  }
}
type ActorPointer = Omit<Credentials, 'tokens'>

export const init = async (session: ArtifactSession) => {
  const { homeAddress } = session
  const { pid } = await session.init({
    repo: 'dreamcatcher-tech/github',
    isolate: 'github',
    params: { homeAddress },
  })
  log('github installed', print(pid))

  const actor = await session.actions<Actors.Admin>('actors', homeAddress)
  await actor.addAuthProvider({ name: 'github', provider: pid })
}
