import { PID } from '@/constants.ts'
import type { Tokens } from '@deno/kv-oauth'

export type Admin = {
  /**
   * Register an attempt to do the oauth loop, so that when the browser comes
   * back successfuly, we can bind its PAT to the machine public key.
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

export const functions = {}
