// copied from the artifact project
import { z, type ZodSchema } from 'zod'
export type { AssistantMessage, CompletionMessage } from '../openai/zod.ts'
import { completionMessage } from '../openai/zod.ts'
import type { Backchat } from './client-backchat.ts'
import { assert } from '@std/assert'
import type OpenAI from 'openai'
import { randomness } from './randomness.ts'
export { randomness }
type CommitOid = string

export { type Backchat }
export const Proctype = z.enum(['SERIAL', 'BRANCH', 'DAEMON', 'EFFECT'])
// TODO FORGET = 'FORGET', // allow fire and forget actions
// BUT forget needs to be a separate option as we need DAEMON and FORGET
// together to allow for a fire and forget branches
// OR make DAEMON be the same as FORGET since no new info need be returned ?

export const md5 = z.string().regex(/^[a-f0-9]{40}$/, 'Invalid MD5 hash')

export const triad = z.object({
  path: z.string(),
  pid: pidSchema,
  commit: z.string(),
})
export type Triad = z.infer<typeof triad>

export type ProcessOptions = {
  /**
   * Any function called with this option will be executed in parallel
   * in a new branch, with no guarantee of order of execution.  A call to this
   * function will cause 3 commits to occur, 2 of which may be pooled with other
   * functions.  The commits are:
   * 1. The current branch, to declare the function invocation - may be pooled
   * 2. The new branch, to conclude the function invocation - may be skippable
   *    if no fs changes were made
   * 3. The current branch, to merge the result back in - may be pooled
   *
   * Without this option, the functions will be executed in the same
   * branch as the caller, and will be executed in the order that any other
   * similarly called functions were invoked.
   * A call to this function will cause two commits to occur on the current
   * branch - the first to store the function call, and the second to store the
   * result.  Both commits may be shared with other function calls.
   */
  branch?: boolean
  /**
   * Enables Daemon mode, where the branch will not be closed after the process
   * is done.
   */
  noClose?: boolean
  /** Set a prefix for the new branch name, which will be combined with a
   * random id and separated by a "-". Implies branch = true
   */
  prefix?: string
  /** Set the name of the new branch.  Will error if this exists already */
  branchName?: string
  /** Provide file paths that will be deleted in the new branch */
  deletes?: string[]
}

export type PathTriad = {
  path: string
  pid?: PID
  commit?: CommitOid
}

/**
 * A request that has been included in a commit, therefore has a sequence number
 */
export type SolidRequest = z.infer<typeof solidRequest>
const solidRequest = invocation.extend({
  target: pidSchema,
  source: pidSchema,
  sequence: sequenceInteger,
})

export type UnsequencedRequest = z.infer<typeof unsequencedRequest>
export const unsequencedRequest = invocation.extend({ target: pidSchema })

export type Request = z.infer<typeof requestSchema>
export const requestSchema = z.union([
  pierceSchema,
  solidRequest,
  remoteRequest,
])
// TODO remove this by passing ProcessOptions in with the Request
export const getProcType = (procOpts?: ProcessOptions) => {
  if (!procOpts) {
    return Proctype.enum.SERIAL
  }
  if (procOpts.noClose) {
    return Proctype.enum.DAEMON
  }
  if (
    procOpts.deletes || procOpts.branch || procOpts.branchName ||
    procOpts.prefix
  ) {
    return Proctype.enum.BRANCH
  }
  return Proctype.enum.SERIAL
}

export type Change = {
  /** If present, represents the unified diff of the file at the given path,
   * since the last commit.  This is only provided if the file is a string.  If
   * the changes are too large, this will be missing and an oid will be provided.
   */
  patch?: string
  /**
   * The oid of the object given by path, which can be used to fetch the object
   * directly. If this file is binary, then patch will be missing, and the file
   * should be directly retrieved.  If oid is missing, then the change was
   * fatal.
   */
  oid?: string
}
export type Splice = {
  pid: PID
  /**
   * The hash of the commit object
   */
  oid: string
  /**
   * The commit this splice refers to
   */
  commit: CommitObject
  /**
   * The timestamp of the commit, or if transient, the timestamp of the write
   * that caused this update
   */
  timestamp: number
  changes: { [key: string]: Change }
}
export declare interface EventSourceMessage {
  /** The data received for this message. */
  data: string
  /** Event name sent from the server, or `undefined` if none is set for this message. */
  event?: string
  /** ID of the message, if any was provided by the server. */
  id?: string
}
/**
 * A git commit object.
 */
export type CommitObject = {
  /**
   * Commit message
   */
  message: string
  /**
   * SHA-1 object id of corresponding file tree
   */
  tree: string
  /**
   * an array of zero or more SHA-1 object ids
   */
  parent: string[]
  author: {
    /**
     * The author's name
     */
    name: string
    /**
     * The author's email
     */
    email: string
    /**
     * UTC Unix timestamp in seconds
     */
    timestamp: number
    /**
     * Timezone difference from UTC in minutes
     */
    timezoneOffset: number
  }
  committer: {
    /**
     * The committer's name
     */
    name: string
    /**
     * The committer's email
     */
    email: string
    /**
     * UTC Unix timestamp in seconds
     */
    timestamp: number
    /**
     * Timezone difference from UTC in minutes
     */
    timezoneOffset: number
  }
  /**
   * PGP signature (if present)
   */
  gpgsig?: string
}

export interface EngineInterface {
  /**
   * The address in use as basis of identity for this engine.  May be a repo
   * hosted on external engines, or hosted in cooperation with other engines.
   */
  homeAddress: PID
  abortSignal: AbortSignal
  upsertBackchat(machineId: string, resume?: string): Promise<PID>
  stop(): Promise<void> | void
  /**
   * Send a ping to the edge isolate that will process requests, to establish
   * basic network connectivity. To ping a chain, use an isolate.
   * TODO ping should return some info about the deployment
   * @param data Data that will be echoed back
   */
  ping(data?: JsonValue): Promise<IsolateReturn>
  apiSchema(isolate: string): Promise<Record<string, object>>
  transcribe(audio: File): Promise<{ text: string }>
  pierce(pierce: Pierce): Promise<void>
  watch(
    pid: PID,
    path?: string,
    after?: string,
    signal?: AbortSignal,
  ): AsyncIterable<Splice>
  splice(
    target: PID,
    opts?: { commit?: string; path?: string; count?: number },
  ): Promise<Splice[]>
  read(path: string, pid: PID, commit?: string): Promise<string>
  readTree(path: string, pid: PID, commit?: string): Promise<TreeEntry[]>
  readJSON<T>(path: string, pid: PID, commit?: string): Promise<T>
  readBinary(path: string, pid?: PID, commit?: string): Promise<Uint8Array>
  exists(path: string, pid: PID): Promise<boolean>
}

export type RpcOpts = { target?: PID } & ProcessOptions
export const toActions = <T = DispatchFunctions>(
  target: PID,
  isolate: string,
  schema: IsolateApiSchema,
  procOpts: ProcessOptions,
  execute: (request: UnsequencedRequest) => unknown | Promise<unknown>,
) => {
  procOpts = procOpts || {}
  if (procOpts.prefix && procOpts.branchName) {
    throw new Error('failed mutex: ' + print(target))
  }
  const proctype = getProcType(procOpts)
  const actions: DispatchFunctions = {}
  for (const functionName of Object.keys(schema)) {
    actions[functionName] = (arg1: Params = {}) => {
      const params = safeParams(arg1)
      const unsequencedRequest: UnsequencedRequest = {
        target,
        isolate,
        functionName,
        params,
        proctype,
      }
      if (procOpts.prefix) {
        unsequencedRequest.branchPrefix = procOpts.prefix
      }
      if (procOpts.branchName) {
        unsequencedRequest.branchName = procOpts.branchName
      }
      if (procOpts.deletes) {
        unsequencedRequest.deletes = procOpts.deletes
      }
      return execute(unsequencedRequest)
    }
  }
  return actions as PromisifyFunctionReturnTypes<T>
}
type PromisifyFunctionReturnTypes<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer R
    ? (...args: Args) => R extends Promise<unknown> ? R : Promise<R>
    : T[K]
}
const safeParams = (params: Params) => {
  const safe = { ...params }
  for (const key in safe) {
    if (safe[key] === undefined) {
      delete safe[key]
    }
  }
  checkUndefined(safe)
  return safe
}
const checkUndefined = (params: Params) => {
  for (const key in params) {
    if (params[key] === undefined) {
      throw new Error('undefined value: ' + key)
    }
    if (typeof params[key] === 'object') {
      checkUndefined(params[key] as Params)
    }
  }
}

export const generateBackchatId = () => {
  return 'bac_' + randomness()
}

export const isPidEqual = (pid1: PID, pid2: PID) => {
  // TODO why not just use the fast-equals utility ?
  if (pid1.repoId !== pid2.repoId) {
    return false
  }
  if (pid1.account !== pid2.account) {
    return false
  }
  if (pid1.repository !== pid2.repository) {
    return false
  }
  if (pid1.branches.length !== pid2.branches.length) {
    return false
  }
  for (let i = 0; i < pid1.branches.length; i++) {
    if (pid1.branches[i] !== pid2.branches[i]) {
      return false
    }
  }
  return true
}

export const backchatStateSchema = z.object({
  /** The base thread that this backchat session points to - the thread of last resort */
  target: pidSchema,
  threadCount: z.number().int().gte(0),
})

export type TreeEntry = {
  /**
   * - the 6 digit hexadecimal mode
   */
  mode: string
  /**
   * - the name of the file or directory
   */
  path: string
  /**
   * - the SHA-1 object id of the blob or tree
   */
  oid: string
  /**
   * - the type of object
   */
  type: 'blob' | 'tree' | 'commit'
}
export const pooledRef = z.object({
  commit: md5,
  sequence: sequenceInteger,
  source: pidSchema,
  isReply: z.boolean(),
})
export type PooledRef = z.infer<typeof pooledRef>
