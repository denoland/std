// copied from the artifact project
import { JSONSchemaType } from './web-client.ajv.ts'
export enum PROCTYPE {
  SERIAL = 'SERIAL',
  BRANCH = 'BRANCH',
  DAEMON = 'DAEMON',
  EFFECT = 'EFFECT',
  // TODO FORGET = 'FORGET', // allow fire and forget actions
}
export type { JSONSchemaType }

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
    [key: string]: JsonValue
  }
export type IsolateReturn = JsonValue | undefined | void
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
   * Should the branch be closed after the process is done.
   * Implies `branch: true`
   */
  noClose?: boolean
  // TODO add prefix option so the branch name can be set
  // the name must have the sequence suffix so that determinism is in there
  // also frees us from doing a collision check
}
export type DispatchFunctions = {
  [key: string]: (
    params?: Params,
    options?: ProcessOptions,
  ) => Promise<unknown> | unknown
}
export type Params = { [key: string]: JsonValue }

export type IsolateApiSchema = {
  [key: string]: JSONSchemaType<object>
}
export type SerializableError = {
  name: string
  message: string
  stack?: string
}
export type Outcome = { result?: JsonValue; error?: SerializableError }
export const ENTRY_BRANCH = 'main'
/**
 * The Process Identifier used to address a specific process branch.
 */
export type PID = {
  account: string
  repository: string
  branches: string[]
}

export type HelpConfig = {
  model?: 'gpt-3.5-turbo' | 'gpt-4-turbo-preview'
  temperature?: number
}
export type Help = {
  description?: string
  config?: HelpConfig
  runner?: RUNNERS
  commands?: string[]
  instructions: string[]
  done?: string
  examples?: string[]
  tests?: string[]
}
export type Invocation = {
  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
  /**
   * Allow a custom name for the new branch, if this is a branching request
   */
  branch?: string
  /**
   * If the custom branch name might not be unique, a prefix can be given and
   * the sequence number will be appended to the branch name, ensuring
   * uniqueness.
   */
  branchPrefix?: string
}
export type PierceRequest = Invocation & {
  target: PID
  ulid: string
}

// TODO remove this by passing ProcessOptions in with the Request
export const getProcType = (options?: ProcessOptions) => {
  if (!options) {
    return PROCTYPE.SERIAL
  }
  if (options.noClose) {
    return PROCTYPE.DAEMON
  }
  if (options.branch) {
    return PROCTYPE.BRANCH
  }
  return PROCTYPE.SERIAL
}
export enum RUNNERS {
  CHAT = 'runner-chat',
  INJECTOR = 'runner-injector',
}
export const toString = (pid: PID) => {
  return `${pid.account}/${pid.repository}:${pid.branches.join('_')}`
}
type Change = {
  count?: number | undefined
  /**
   * Text content.
   */
  value: string
  /**
   * `true` if the value was inserted into the new string.
   */
  added?: boolean | undefined
  /**
   * `true` if the value was removed from the old string.
   */
  removed?: boolean | undefined
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
  path?: string
  changes?: Change[]
  /**
   * True if the file requested is binary.  Use a get request to fetch the file
   * directly at the specific commit.
   */
  binary?: boolean
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
export interface ArtifactCore {
  ping(
    params?: { data?: JsonValue; pid?: PID },
    api?: unknown,
  ): Promise<IsolateReturn>
  pierce(
    params: { pierce: PierceRequest },
    api?: unknown,
  ): Promise<IsolateReturn>
  probe(
    params: { repo?: string; pid?: PID },
    api?: unknown,
  ): Promise<{ pid: PID; head: string } | void>
  init(
    params: { repo: string },
    api?: unknown,
  ): Promise<{ pid: PID; head: string }>
  clone(
    params: { repo: string },
    api?: unknown,
  ): Promise<{ pid: PID; head: string }>
  pull(params: { pid: PID }, api?: unknown): Promise<{ pid: PID; head: string }>
  push(params: { pid: PID }, api?: unknown): Promise<void>
  rm(params: { repo: string }, api?: unknown): Promise<void>
  apiSchema(
    params: { isolate: string },
    api?: unknown,
  ): Promise<Record<string, JSONSchemaType<object>>>
  transcribe(params: { audio: File }): Promise<{ text: string }>
  logs(params: { repo: string }, api?: unknown): Promise<object[]>
}
export interface Artifact extends ArtifactCore {
  stop(): Promise<void> | void
  pierces(isolate: string, target: PID): Promise<DispatchFunctions>
  // TODO should move these git functions elsewhere ?
  read(pid: PID, path?: string, signal?: AbortSignal): ReadableStream<Splice>
}
export const isPID = (value: unknown): value is PID => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const pid = value as PID
  return (
    typeof pid.account === 'string' &&
    typeof pid.repository === 'string' &&
    Array.isArray(pid.branches) &&
    pid.branches.every((branch) => typeof branch === 'string')
  )
}
export const print = (pid: PID) => {
  return `${pid.account}/${pid.repository}:${pid.branches.join('/')}`
}
