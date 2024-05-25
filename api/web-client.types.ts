// copied from the artifact project
import { Chalk } from 'chalk'
import { JSONSchemaType } from './web-client.ajv.ts'
import { Terminal } from './web-client-session.ts'
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
  /** Set a prefix for the new branch name.  Implies branch = true */
  prefix?: string
  /** Set the name of the new branch.  Will error if this exists already */
  branchName?: string
}
export type IoStruct = {
  sequence: number
  /** The current sequence of the request being executed serially */
  executing?: number
  /** The sequences of requests that have been executed serially */
  executed: { [key: number]: boolean }
  requests: { [key: number]: Request }
  replies: { [key: number]: Outcome }
  /**
   * If a request generates child requests, they are tracked here.  The commit
   * in each entry is the commit that caused the child requests to be generated.
   * This is used to replay by resetting the fs to that commit and doing a
   * replay.
   */
  pendings: {
    [key: number]: { commit: string; sequences: number[] }[]
  }
  /** Active branches are stored here.  A branch is a daemon if it is listed
   * here but its request has been replied to or it is gone from the requests
   * list */
  branches: {
    [sequence: number]: BranchName
  }
}
type BranchName = string
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
   * The hash of the genesis commit is used to identify this repo in a
   * cryptographically secure way.  This repoId is used to reference this repo
   * unique with strong guarantees that this is the correct repo that
   * communication was intended with.
   */
  repoId: string
  account: string
  repository: string
  branches: string[]
}
export type PartialPID = Omit<PID, 'repoId'>

export type HelpConfig = {
  model?: 'gpt-3.5-turbo' | 'gpt-4-turbo' | 'gpt-4o'
  temperature?: number
}
export type Help = {
  description?: string
  config?: HelpConfig
  runner: RUNNERS
  commands?: string[]
  instructions: string
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
  /**
   * If the request is a branching request, this will be the name of the new
   * branch.  If the branch already exists, the request will fail.
   */
  branchName?: string
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
  params: { request: UnsequencedRequest }
}
export const isPierceRequest = (p: Request): p is PierceRequest => {
  return 'ulid' in p
}
export type UnsequencedRequest = Omit<
  RemoteRequest,
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
export type RemoteRequest = SolidRequest & {
  commit: string
}
export type Request = PierceRequest | SolidRequest | RemoteRequest

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
  CHAT = 'ai-prompt',
  INJECTOR = 'ai-prompt-injector',
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

type ApiSchema = Record<string, JSONSchemaType<object>>
type PidHead = { pid: PID; head: string }

/** The client session interface to artifact */
export interface ArtifactTerminal {
  pid: PID
  machine: ArtifactMachine
  terminalId: string
  homeAddress: PID
  initializationPromise: Promise<void>
  stop(): void
  engineStop(): Promise<void>
  /**
   * This is managed client side, and can be composed any way people like
   */
  dns(repo: string): Promise<PID>
  actions<T = DispatchFunctions>(isolate: string, target?: PID): Promise<T>
  read(
    pid: PID,
    path?: string,
    after?: string,
    signal?: AbortSignal,
  ): AsyncIterable<Splice>
  readJSON<T>(path: string, pid?: PID): Promise<T>
  exists(path: string, pid?: PID): Promise<boolean>
  transcribe(params: { audio: File }): Promise<{ text: string }>
  apiSchema(isolate: string): Promise<ApiSchema>
  /** Pings the execution context without going thru the transaction queue.
   *
   * Used primarily by web clients to establish base connectivity and get
   * various diagnostics about the platform they are interacting with */
  ping(params?: { data?: JsonValue; pid?: PID }): Promise<IsolateReturn>
  /** Calls the repo isolate */
  init(
    params: { repo: string; isolate?: string; params?: Params },
  ): Promise<PidHead>
  clone(
    params: { repo: string; isolate?: string; params?: Params },
  ): Promise<PidHead>
  pull(params: { pid: PID }): Promise<PidHead>
  push(params: { pid: PID }): Promise<void>
  rm(params: { repo: string }): Promise<boolean>
  endSession(): Promise<void>
  /** Remove the account if currently signed in */
  deleteAccountUnrecoverably(): Promise<void>
  newTerminal(): ArtifactTerminal
  resumeTerminal(pid: PID): ArtifactTerminal
  ensureBranch(branch: PID, ancestor: PID): Promise<PID>
}
/** The client home interface to Artifact, only able to create new sessions.
Will handle the generation of signing keys for the session, and authentication
with github.
 */
export interface ArtifactMachine {
  pid: PID
  machineId: string
  rootTerminalPromise: Promise<Terminal>
  /** Using the current session, create a new session. */
  openTerminal(retry?: PID): ArtifactTerminal
  /** Pings the execution context without going thru the transaction queue.
   *
   * Used primarily by web clients to establish base connectivity and get
   * various diagnostics about the platform they are interacting with */
  ping(params?: { data?: JsonValue; pid?: PID }): Promise<IsolateReturn>
}
export interface EngineInterface {
  /**
   * The address in use as basis of identity for this engine.  May be a repo
   * hosted on external engines, or hosted in cooperation with other engines.
   */
  homeAddress: PID
  abortSignal: AbortSignal
  stop(): Promise<void> | void
  pierce(pierce: PierceRequest): Promise<void>
  read(
    pid: PID,
    path?: string,
    after?: string,
    signal?: AbortSignal,
  ): AsyncIterable<Splice>
  readJSON<T>(path: string, pid: PID): Promise<T>
  exists(path: string, pid: PID): Promise<boolean>
  transcribe(audio: File): Promise<{ text: string }>
  apiSchema(isolate: string): Promise<ApiSchema>
  ping(data?: JsonValue): Promise<IsolateReturn>
  /**
   * When a new machine is created, it needs to create its actorId and its
   * machineId needs to be inserted to that actor.  It will immediately start a
   * session, so this all gets done in one shot.
   *
   * Without this function, a new machine has no way to begin piercing into
   * chainland.
   */
  ensureMachineTerminal(machinePid: PID): Promise<void>
  /** Checks if the provided PID is active and accessible to this machine.  If
   * it is not accessible due to permissions, it will appear as tho it did not
   * exist */
  isTerminalAvailable(pid: PID): Promise<boolean>
  ensureBranch(pierce: PierceRequest): Promise<void>
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
const { black, red, green, blue, magenta, cyan, bold } = new Chalk({ level: 1 })
const colors = [red, green, blue, magenta, cyan, black]
let colorIndex = 0
const colorMap = new Map<string, number>()
export const colorize = (string: string, noSubstring = false) => {
  let sub = string
  if (!noSubstring) {
    sub = string.substring(0, 7)
  }
  let index
  if (colorMap.has(sub)) {
    index = colorMap.get(sub)!
  } else {
    index = colorIndex++
    if (colorIndex === colors.length) {
      colorIndex = 0
    }
    colorMap.set(sub, index)
  }

  return colors[index](bold(sub))
}
export const print = (pid?: PID) => {
  if (!pid) {
    return '(no pid)'
  }
  const branches = pid.branches.map((segment) => {
    if (terminalIdRegex.test(segment)) {
      return colorize(segment.slice(-7))
    }
    if (machineIdRegex.test(segment)) {
      return colorize(segment)
    }
    return colorize(segment, true)
  })
  return `${colorize(pid.repoId)}/${pid.account}/${pid.repository}:${
    branches.join('/')
  }`
}
export const freezePid = (pid: PID) => {
  if (!pid.repoId) {
    throw new Error('repoId is required')
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
export const partialFromRepo = (repo: string) => {
  const [account, repository] = repo.split('/')
  const pid: PartialPID = {
    account,
    repository,
    branches: [ENTRY_BRANCH],
  }
  return pid
}

export const ACTORS: Omit<PID, 'repoId'> = {
  account: 'dreamcatcher-tech',
  repository: 'actors',
  branches: ['base'],
}
export const toActions = <T = DispatchFunctions>(
  target: PID,
  isolate: string,
  schema: IsolateApiSchema,
  execute: (request: UnsequencedRequest) => Promise<unknown>,
) => {
  const actions: DispatchFunctions = {}
  for (const functionName of Object.keys(schema)) {
    actions[functionName] = (arg1?: Params, options?: ProcessOptions) => {
      const proctype = getProcType(options)
      const params = safeParams(arg1)
      const unsequencedRequest: UnsequencedRequest = {
        target,
        isolate,
        functionName,
        params,
        proctype,
      }
      options = options || {}
      if (options.prefix && options.branchName) {
        throw new Error('failed mutex: ' + print(target))
      }
      if (options.prefix) {
        unsequencedRequest.branchPrefix = options.prefix
      }
      if (options.branchName) {
        unsequencedRequest.branchName = options.branchName
      }
      return execute(unsequencedRequest)
    }
  }

  return actions as T
}
const safeParams = (params?: Params) => {
  if (!params) {
    return {}
  }
  const safe = { ...params }
  for (const key in safe) {
    if (safe[key] === undefined) {
      delete safe[key]
    }
  }
  return safe
}

export const assertValidTerminal = (pid: PID, identity: PID) => {
  const { repoId, account, repository, branches } = identity
  const msg = print(pid)
  if (pid.repoId !== repoId) {
    throw new Error('invalid repoId: ' + msg)
  }
  if (pid.account !== account) {
    throw new Error('invalid account: ' + msg)
  }
  if (pid.repository !== repository) {
    throw new Error('invalid repository: ' + msg)
  }
  if (pid.branches[0] !== branches[0]) {
    throw new Error('invalid branch: ' + msg)
  }
  if (pid.branches.length !== 4) {
    throw new Error('invalid initial pid: ' + msg)
  }
  if (pid.branches[1] !== pid.branches[2]) {
    throw new Error('invalid actor: ' + msg)
  }
  const [, , machineId, sessionId] = pid.branches
  if (!machineIdRegex.test(machineId)) {
    throw new Error('invalid machineId: ' + msg)
  }
  if (!terminalIdRegex.test(sessionId)) {
    throw new Error('invalid terminalId: ' + msg)
  }
}
export const machineIdRegex = /^[0-9a-f]{66}$/
export const terminalIdRegex =
  /^[0-7][0-9A-HJKMNP-TV-Z]{9}[0-9A-HJKMNP-TV-Z]{16}$/
export const ROOT_SESSION = '111111111111111R00TSESS10N'
export const getActorPid = (source: PID) => {
  const branches = source.branches.slice(0, 2)
  return { ...source, branches }
}
export const getActorId = (source: PID) => {
  const [, actorId] = source.branches
  return actorId
}
export const getMachineId = (source: PID) => {
  const [, , machineId] = source.branches
  return machineId
}
export const isTerminalPID = (source: PID) => {
  const [, actorId, machineId, terminalId] = source.branches
  return (
    source.branches.length === 4 &&
    machineIdRegex.test(actorId) &&
    machineIdRegex.test(machineId) &&
    terminalIdRegex.test(terminalId)
  )
}
export const isPidEqual = (pid1: PID, pid2: PID) => {
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
export const isValidForMachine = (terminal: PID, machine: PID) => {
  const branches = terminal.branches.slice(0, -1)
  const test = { ...machine, branches }
  return isPidEqual(test, machine)
}
