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
export type IoStruct = {
  sequence: number
  requests: { [key: string]: Request }
  replies: { [key: string]: Outcome }
  /**
   * If a request generates child requests, they are tracked here.  The commit
   * in each entry is the commit that caused the child requests to be generated.
   * This is used to replay by resetting the fs to that commit and doing a
   * replay.
   */
  pendings: {
    [key: number]: { commit: string; sequences: number[] }[]
  }
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
  /**
   * The account within artifact that owns the repository.
   * Later, this will become the chainId of the controlling account holding the
   * repository.
   */
  id: string
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
  effect?: boolean | {
    /** does this side effect have access to the network ? */
    net?: boolean
    /** does this side effect have access to the files of the repo ? */
    files?: boolean
    /** can this side effect make execution requests in artifact ? */
    artifact?: boolean
    /** Specify the maximum time to wait for this side effect to complete */
    timeout?: number
  }
}
export type PierceRequest = Invocation & {
  target: PID
  ulid: string
}
export const isPierceRequest = (p: Request): p is PierceRequest => {
  return 'ulid' in p
}
export type UnsequencedRequest = Omit<
  MergeRequest,
  'sequence' | 'source' | 'commit'
>
/**
 * A request that has been included in a commit, therefore has a sequence number
 */
export type SolidRequest = Invocation & {
  target: PID
  source: PID
  sequence: number
}
/** A request that travels between branches */
export type MergeRequest = SolidRequest & {
  commit: string
}
export type Request = PierceRequest | SolidRequest | MergeRequest

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

type ApiSchema = Record<string, JSONSchemaType<object>>
type Head = { pid: PID; head: string }

/** The client interface to artifact */
export interface Artifact {
  pid: PID
  stop(): Promise<void> | void
  actions(isolate: string, target: PID): Promise<DispatchFunctions>
  read(pid: PID, path?: string, signal?: AbortSignal): ReadableStream<Splice>
  transcribe(params: { audio: File }): Promise<{ text: string }>
  apiSchema(isolate: string): Promise<ApiSchema>
  /** Pings the execution context without going thru the transaction queue.
   *
   * Used primarily by web clients to establish base connectivity and get
   * various diagnostics about the platform they are interacting with */
  ping(params?: { data?: JsonValue; pid?: PID }): Promise<IsolateReturn>
  /** Calls the repo isolate */
  probe(params: { pid: PID }): Promise<Head | void>
  init(params: { repo: string }): Promise<Head>
  clone(params: { repo: string }): Promise<Head>
  pull(params: { pid: PID }): Promise<Head>
  push(params: { pid: PID }): Promise<void>
  rm(params: { repo: string }): Promise<boolean>
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
  return `${pid.id}/${pid.account}/${pid.repository}:${pid.branches.join('/')}`
}
export const freezePid = (pid: PID) => {
  if (!pid.id) {
    throw new Error('id is required')
  }
  if (!pid.account) {
    throw new Error('account is required')
  }
  if (!pid.repository) {
    throw new Error('repository is required')
  }
  if (!pid.branches[0]) {
    throw new Error('branch is required')
  }
  const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
  Object.freeze(pid)
  Object.freeze(pid.branches)
}
export const pidFromRepo = (id: string, repo: string): PID => {
  const [account, repository] = repo.split('/')
  const pid: PID = {
    id,
    account,
    repository,
    branches: [ENTRY_BRANCH],
  }
  freezePid(pid)
  return pid
}
export interface EngineInterface {
  stop(): Promise<void> | void
  pierce(pierce: PierceRequest): Promise<void>
  read(pid: PID, path?: string, signal?: AbortSignal): ReadableStream<Splice>
  transcribe(audio: File): Promise<{ text: string }>
  apiSchema(isolate: string): Promise<ApiSchema>
  ping(data?: JsonValue): Promise<IsolateReturn>
}
