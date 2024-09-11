// copied from the artifact project
import { Chalk } from 'chalk'
import { z, ZodSchema } from 'zod'
export type { AssistantMessage, CompletionMessage } from './zod.ts'
import { completionMessage } from './zod.ts'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { base32crockford } from '@scure/base'
import type { Backchat } from './client-backchat.ts'
import { assert } from '@sindresorhus/is'
import type OpenAI from 'openai'

type CommitOid = string

const sequenceInteger = z.number().int().gte(0)
const sequenceKey = z.string().refine((data) => {
  try {
    return sequenceInteger.safeParse(Number.parseInt(data)).success
  } catch (error) {
    return !error
  }
}, 'sequence key must be an integer')

export { Backchat }
export const Proctype = z.enum(['SERIAL', 'BRANCH', 'DAEMON', 'EFFECT'])
// TODO FORGET = 'FORGET', // allow fire and forget actions
// BUT forget needs to be a separate option as we need DAEMON and FORGET
// together to allow for a fire and forget branches
// OR make DAEMON be the same as FORGET since no new info need be returned ?

export type STATEBOARD_WIDGETS = z.infer<typeof STATEBOARD_WIDGETS>
export const STATEBOARD_WIDGETS = z.enum([
  'TPS_REPORT',
  'FILE_EXPLORER',
  'MARKDOWN_EDITOR',
  'BRANCH_EXPLORER',
  'COMMIT_GRAPH',
  'COMMIT_INFO',
  'THREADS',
  'REPOS',
])
export const md5 = z.string().regex(/^[a-f0-9]{40}$/, 'Invalid MD5 hash')
export const githubRegex = /^[a-zA-Z\d](?:[a-zA-Z\d]|[-.](?=[a-zA-Z\d])){0,38}$/
export const repoIdRegex = /^rep_[0-9A-HJKMNP-TV-Z]{16}$/
export const machineIdRegex = /^mac_[2-7a-z]{33}$/
export const actorIdRegex = /^act_[0-9A-HJKMNP-TV-Z]{16}$/
export const backchatIdRegex = /^bac_[0-9A-HJKMNP-TV-Z]{16}$/
export const threadIdRegex = /^the_[0-9A-HJKMNP-TV-Z]{16}$/
export const agentHashRegex = /^age_[0-9A-HJKMNP-TV-Z]{16}$/

export const SU_ACTOR = 'act_0000000000000000'
export const SU_BACKCHAT = 'bac_0000000000000000'
export const pidSchema = z.object({
  /**
   * The hash of the genesis commit is used to identify this repo in a
   * cryptographically secure way.  This repoId is used to reference this repo
   * unique with strong guarantees that this is the correct repo that
   * communication was intended with.
   */
  repoId: z.string().regex(repoIdRegex),
  account: z.string().regex(githubRegex),
  repository: z.string().regex(githubRegex),
  branches: z.array(z.string()).min(1),
})
export const triad = z.object({
  path: z.string(),
  pid: pidSchema,
  commit: z.string(),
})
export type Triad = z.infer<typeof triad>
export type ApiFunction = {
  (): unknown | Promise<unknown>
  (...args: [{ [key: string]: unknown }]): unknown | Promise<unknown>
}
export type ApiFunctions = {
  [key: string]: ApiFunction
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

export type DispatchFunctions = {
  [key: string]: (params?: Params) => Promise<unknown> | unknown
}

export type IsolateApiSchema = {
  [key: string]: object
}

export const ENTRY_BRANCH = 'main'

export type PartialPID = Omit<PID, 'repoId'>

export const threadSchema = z.object({
  /** If this thread is deferring to a remote, send messages to it, rather than taking on the the current messages directly */
  remote: pidSchema.optional(),
  /** If the messages were truncated, this is the offset count */
  messageOffset: z.number(),
  messages: z.array(completionMessage),
  toolCommits: z.record(
    /** The tool call id */
    z.string(),
    /** The commit hash the tool ended on */
    md5,
  ),
  /** Have any files been changed in this threads branch */
  isDirty: z.boolean().optional(),
  summaries: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      /** The message index that this summary starts with */
      start: z.number().int().gte(0),
      /** The message index that this summary ends with */
      end: z.number().int().gte(0).optional(),
    }).refine((data) => data.end === undefined || data.end >= data.start, {
      message: "'end' must be greater than or equal to 'start'",
      path: ['end'],
    }),
  ).optional(),
  /** History of stateboard changes */
  stateboards: z.array(z.object({
    /** What message number set the stateboard change */

    setter: z.number(),
    commit: z.string(),
  })),
  /** History of what the focus file path was set to (like the CWD).  Allows
   * statements like "the previous file", "that other file", and "three files
   * ago"  */
  focusedFiles: z.array(z.object({
    /** The message number that set the focus */
    setter: z.number(),
    focus: z.object({
      // Define the structure of PathTriad here
    }),
  })),
})
export type Thread = z.infer<typeof threadSchema>

export type AssistantsThread = Thread & {
  externalId: string
  messages: OpenAI.Beta.Threads.Message[]
  additionalMessages: OpenAI.Beta.Threads.RunCreateParams.AdditionalMessage[]
}
export type RemoteThread = {
  /** The location in the remote repo and the last known commit we have of it */
  triad: Triad
}

export type PathTriad = {
  path: string
  pid?: PID
  commit?: CommitOid
}

export const isPierceRequest = (p: Request): p is PierceRequest => {
  return 'ulid' in p
}
export type Params = { [key: string]: JsonValue }

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
export type JsonValue = Literal | { [key: string]: JsonValue } | JsonValue[]
export const jsonSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
)

const invocation = z.object({
  isolate: z.string(),
  functionName: z.string(),
  params: z.record(jsonSchema),
  proctype: Proctype,
  /**
   * Allow a custom name for the new branch, if this is a branching request
   */
  branch: z.string().optional(),
  /**
   * If the custom branch name might not be unique, a prefix can be given and
   * the sequence number will be appended to the branch name, ensuring
   * uniqueness.
   */
  branchPrefix: z.string().optional(),
  /**
   * If the request is a branching request, this will be the name of the new
   * branch.  If the branch already exists, the request will fail.
   */
  branchName: z.string().optional(),
  /** Relative paths to delete in the branch */
  deletes: z.array(z.string()).optional(),
  effect: z.union([
    z.boolean(),
    z.object({
      /** does this side effect have access to the network ? */
      net: z.boolean().optional(),
      /** does this side effect have access to the files of the repo ? */
      files: z.boolean().optional(),
      /** can this side effect make execution requests in artifact ? */
      artifact: z.boolean().optional(),
      /** Specify the maximum time to wait for this side effect to complete */
      timeout: z.number().optional(),
    }),
  ]).optional(),
})
export type Invocation = z.infer<typeof invocation>
/**
 * The Process Identifier used to address a specific process branch.
 */
export type PID = z.infer<typeof pidSchema>
/**
 * A request that has been included in a commit, therefore has a sequence number
 */
export type SolidRequest = z.infer<typeof solidRequest>
const solidRequest = invocation.extend({
  target: pidSchema,
  source: pidSchema,
  sequence: sequenceInteger,
})

/** A request that travels between branches */
export type RemoteRequest = z.infer<typeof remoteRequest>
export const remoteRequest = solidRequest.extend({ commit: md5 })

export type PierceRequest = z.infer<typeof pierceRequest>
export const pierceRequest = invocation.extend({
  target: pidSchema,
  ulid: z.string(),
})

export type UnsequencedRequest = z.infer<typeof unsequencedRequest>
export const unsequencedRequest = invocation.extend({ target: pidSchema })

export type Request = z.infer<typeof requestSchema>
export const requestSchema = z.union([
  pierceRequest,
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
/** Here is where additional AI models and runner techniques can be added */
export enum AGENT_RUNNERS {
  CHAT = 'ai-runner',
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
  pierce(pierce: PierceRequest): Promise<void>
  watch(
    pid: PID,
    path?: string,
    after?: string,
    signal?: AbortSignal,
  ): AsyncIterable<Splice>
  read(path: string, pid: PID, commit?: string): Promise<string>
  readJSON<T>(path: string, pid: PID, commit?: string): Promise<T>
  exists(path: string, pid: PID): Promise<boolean>
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
    const noSubstring = !segment.startsWith('mac_') &&
      !segment.startsWith('bac_') &&
      !segment.startsWith('act_') &&
      !segment.startsWith('rep_') &&
      !segment.startsWith('the_')
    return colorize(segment, noSubstring)
  })
  return `${colorize(pid.repoId)}/${pid.account}/${pid.repository}:${
    branches.join('/')
  }`
}
export const freezePid = (pid: PID) => {
  if (!pid.repoId) {
    throw new Error('repoId is required')
  }
  if (!repoIdRegex.test(pid.repoId)) {
    throw new Error('Invalid repoId: ' + pid.repoId)
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
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
  Object.freeze(pid)
  Object.freeze(pid.branches)
  return pid
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

export const HAL: Omit<PID, 'repoId'> = {
  account: 'dreamcatcher-tech',
  repository: 'HAL',
  branches: ['main'],
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

export const generateActorId = (seed: string) => {
  return 'act_' + hash(seed)
}
export const generateBackchatId = (seed: string) => {
  return 'bac_' + hash(seed)
}
export const generateThreadId = (seed: string) => {
  return 'the_' + hash(seed)
}
export const generateAgentHash = (creationString: string) => {
  return 'age_' + hash(creationString)
}

export const getActorId = (source: PID) => {
  const [base, actorId] = source.branches
  const parent = { ...source, branches: [base] }
  const fullHAL = { ...HAL, repoId: source.repoId }
  if (!isPidEqual(parent, fullHAL)) {
    throw new Error('source is not a child of HAL')
  }
  if (!actorIdRegex.test(actorId)) {
    throw new Error('Invalid actor id: ' + actorId)
  }
  return actorId
}
export const getActorPid = (source: PID) => {
  const actorId = getActorId(source)
  const branches = [source.branches[0], actorId]
  return { ...source, branches }
}
export const isActorBranch = (pid: PID) => {
  if (pid.branches.length !== 2) {
    return false
  }
  return !!getActorId(pid)
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
export const META_SYMBOL = Symbol.for('settling commit')
export type Meta = {
  parent?: CommitOid
}
export const withMeta = async <T>(promise: MetaPromise<T>) => {
  const result = await promise
  assert.truthy(META_SYMBOL in promise, 'missing commit symbol')
  const meta = promise[META_SYMBOL]
  assert.object(meta, 'missing meta on promise')
  const { parent } = meta
  if (parent) {
    assert.string(parent, 'missing parent commit')
    assert.truthy(sha1.test(parent), 'commit not sha1: ' + parent)
  }
  return { result, parent }
}
export const sha1 = /^[0-9a-f]{40}$/i
export type MetaPromise<T> = Promise<T> & { [META_SYMBOL]?: Meta }

export const addBranches = (pid: PID, ...children: string[]) => {
  const next = { ...pid, branches: [...pid.branches, ...children] }
  return freezePid(next)
}
export const addPeer = (pid: PID, peer: string) => {
  const branches = [...pid.branches]
  branches.pop()
  const next = { ...pid, branches: [...branches, peer] }
  return freezePid(next)
}
export const getParent = (pid: PID) => {
  const branches = [...pid.branches]
  branches.pop()
  return freezePid({ ...pid, branches })
}
export const getRoot = (pid: PID) => {
  const branches = [pid.branches[0]]
  return freezePid({ ...pid, branches })
}
export const getBaseName = (pid: PID) => {
  return pid.branches[pid.branches.length - 1]
}

export const hash = (seed: string) => {
  const hash = ripemd160(seed)
  const encoded = base32crockford.encode(hash)
  return encoded.slice(-16)
}

export const getContent = (message: AssistantsThread['messages'][number]) => {
  const { content } = message
  if (content[0].type !== 'text') {
    throw new Error('content not text')
  }
  return content[0].text.value
}
export const getThreadPath = (pid: PID) => {
  const [, , ...actorChildBranches] = pid.branches
  const threadPath = actorChildBranches.join('/')
  const path = `threads/${threadPath}.json`
  return path
}

export const agent = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  source: triad.describe('Where exactly did this agent come from'),
  description: z.string().optional(),
  config: z.object({
    model: z.enum(['gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']),
    temperature: z.number().gte(0).lte(2).optional(),
    presence_penalty: z.number().optional(),
    tool_choice: z.enum(['auto', 'none', 'required']).optional().describe(
      'control model behaviour to force it to call a tool or no tool',
    ),
    parallel_tool_calls: z.boolean().optional().describe(
      'Is the model permitted to call more than one function at a time.  Must be false to use strict function calling',
    ),
  }),
  runner: z.enum(['ai-runner']),
  commands: z.array(z.string()),
  instructions: z.string().max(256000),
})
export type Agent = z.infer<typeof agent>

export const chatParams = agent.shape.config.extend({
  messages: z.array(completionMessage),
  seed: z.literal(1337),
  tools: z.array(z.object({
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      description: z.string().optional(),
      parameters: z.object({}).passthrough().optional(),
      strict: z.boolean().optional().nullable(),
    }),
  })).optional(),
})
export type ChatParams = z.infer<typeof chatParams>
export const backchatStateSchema = z.object({
  /** The base thread that this backchat session points to - the thread of last resort */
  target: pidSchema,
})
export type ToApiType<
  P extends Record<string, ZodSchema>,
  R extends { [K in keyof P]: ZodSchema },
> = {
  [K in keyof P]: (
    params: z.infer<P[K]>,
  ) => z.infer<R[K]> | Promise<z.infer<R[K]>>
}

export const serializableError = z.object({
  name: z.string().optional(),
  message: z.string(),
  stack: z.string().optional(),
})
export type SerializableError = z.infer<typeof serializableError>

export const outcomeSchema = z.object({
  result: jsonSchema.optional(),
  error: serializableError.optional(),
}).refine((data) => {
  if (data.error !== undefined) {
    return data.result === undefined
  }
  return true
}, 'result and error are mutually exclusive')

export type Outcome = { result?: JsonValue; error?: SerializableError }

export type IoStruct = z.infer<typeof ioStruct>
export const ioStruct = z.object({
  sequence: sequenceInteger,
  /** The current sequence of the request being executed serially */
  executing: sequenceInteger.optional(),
  /** The sequences of requests that have been executed serially */
  executed: z.record(sequenceKey, z.boolean()),
  // TODO make the requests be a zod schema
  requests: z.record(sequenceKey, requestSchema),
  replies: z.record(sequenceKey, outcomeSchema),
  /** If a reply is a merge reply, the commit that carried it is stored here */
  parents: z.record(sequenceKey, md5),
  /**
   * If a request generates child requests, they are tracked here.  The commit
   * in each entry is the commit that caused the child requests to be generated.
   * This is used to replay by resetting the fs to that commit and doing a
   * replay.
   */
  pendings: z.record(
    sequenceKey,
    z.array(z.object({
      commit: md5,
      sequences: z.array(sequenceInteger),
    })),
  ),
  /** Active branches are stored here.  A branch is a daemon if it is listed
   * here but its request has been replied to or it is gone from the requests
   * list */
  branches: z.record(sequenceKey, z.string()),
  /**
   * Isolates can store values here and know they will not leak into other
   * branches, and will be quick to access since the io file is always loaded.
   */
  state: z.record(jsonSchema),
})
export const reasoning = z.array(z.string()).describe(
  'the brief step by step reasoning why this function was called and what it is trying to achieve',
)
