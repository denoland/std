import type { ZodRecord, ZodTypeAny } from 'zod'
import { z } from 'zod'
import type { NappTypes } from './napps-list.ts'
import { type Action, jsonSchema, type JsonValue } from './actions.ts'
import Debug from 'debug'
import type { Outcome } from './actions.ts'
import { deserializeError } from 'serialize-error'
const log = Debug('@artifact/api')

type TreeEntry = {
  /** the 6 digit hexadecimal mode */
  mode: string
  /** the name of the file or directory */
  path: string
  /** the SHA-1 object id of the blob or tree */
  oid: string
  /** the type of object */
  type: 'blob' | 'tree' | 'commit'
}

/** WriteOptions always refer to the latest snapshot of a branch */
type WriteOptions = {
  /** Posix style path that locates what process thread we want to communicate
   * with.  In git, this would be branch names, for example: `exe/proc-1/child-2` */
  process?: string

  /** The cryptographic identifier of the whole repository.  This would be the
   * chainId in conventional blockchains, but could be a group of public keys,
   * or some other root of trust */
  crypto?: string

  /** Whatever snapshot model is used, the branch concept represents an isolated
   * line of changes.  In git, this would be a branch */
  branch?: string
}
type ReadOptions = WriteOptions & {
  /** Depending on the snapshot format being used, represents the state at a
   * specific point in the history */
  snapshot?: string
}

type PlainTreeEntry = TreeEntry & { type: 'blob' | 'tree' }

interface NappRead {
  readMeta(path: string, options?: ReadOptions): Promise<PlainTreeEntry>
  readText(path: string, options?: ReadOptions): Promise<string>
  readJSON<T extends ZodTypeAny = typeof jsonSchema>(
    path: string,
    options?: ReadOptions & { schema?: T },
  ): Promise<z.infer<T>>
  readBinary(path: string, options?: ReadOptions): Promise<Uint8Array>
  exists(path: string, options?: ReadOptions): Promise<boolean>
  ls(path?: string, options?: ReadOptions): Promise<PlainTreeEntry[]>
}

type PairOptions = WriteOptions & { path: string }

interface NappWrite {
  writeText(
    path: string,
    content: string,
    options?: WriteOptions,
  ): Promise<void>
  writeJSON(
    path: string,
    json: JsonValue,
    options?: WriteOptions,
  ): Promise<void>
  writeBinary(
    path: string,
    content: Uint8Array,
    options?: WriteOptions,
  ): Promise<void>
  rm(path: string, options?: WriteOptions): Promise<void>
  mv(from: PairOptions, to: PairOptions): Promise<void>
  cp(from: PairOptions, to: PairOptions): Promise<void>
}

type SpawnOptions =
  & WriteOptions
  & (
    | { name: string; prefix?: never }
    | { name?: never; prefix: string }
  )
  & {
    files?: string[]
    /** If process exists, exit gracefully */
    upsert?: boolean
    /** Priority of the process */
    nice?: number
  }

type MetaResult = { meta: Required<ReadOptions>; outcome: Outcome }

interface NappProcesses {
  /** start a new process and install the given napp. */
  spawn(napp: keyof NappTypes, options: SpawnOptions): Promise<void>
  /** tear down the specified process, and resturn the result of teardown */
  kill(options: WriteOptions): Promise<JsonValue | undefined>
  /** spawns a new process, installs the napp specified in the action, awaits
   * the execution, and then returns, killing the process */
  async(action: Action, options: SpawnOptions): Promise<JsonValue | undefined>
  /** move a process to another parent.  Can be used to daemonize a running
   * process by moving it to be a child of init */
  mv(to: WriteOptions, from?: WriteOptions): Promise<void>
  /** change the priority of a process */
  nice(level: number, options: WriteOptions): void

  dispatch(
    action: Action,
    options: WriteOptions,
  ): Promise<JsonValue | undefined>
  dispatchWithMeta(action: Action, options: WriteOptions): Promise<MetaResult>
}

const stateSchema = z.record(jsonSchema)

interface NappState {
  getState<T extends ZodRecord = typeof stateSchema>(
    options: ReadOptions & { schema?: T; fallback?: z.infer<T> },
  ): Promise<z.infer<T>>
  // TODO return metadata of the state so we know if it remains unchanged
  // TODO allow fetching paths within the state
  updateState<T extends ZodRecord = typeof stateSchema>(
    updater: (state: z.infer<T>) => z.infer<T>,
    options: ReadOptions & { schema?: T },
  ): Promise<z.infer<T>>
  setState<T extends ZodRecord = typeof stateSchema>(
    state: z.infer<T>,
    options: ReadOptions & { schema?: T },
  ): Promise<void>
}

interface NappEffects {
  /** Side effects can listen to this signal to abort their activities */
  get signal(): AbortSignal

  /** If the side effect lock was broken in order to start this instance.
   * Implies the previous executing instance was aborted */
  get isEffectRecovered(): boolean

  /** The context of the current side effect, which acts like a React ref, and
   * is a mutable store of any value at all */
  set context(value: unknown)

  get context(): unknown
}

export interface NappApi {
  readonly state: NappState
  readonly read: NappRead
  readonly write: NappWrite
  readonly processes: NappProcesses
  readonly effects: NappEffects
}

export class NappApi implements NappApi {
  // all this thing does is create actions
  // these are then interpreted by whatever is running them
  // so it can be used for client side, inside a napp, or for handling different
  // processes, branches, and remote repositories
}

/**
 * Use this to unwrap the results of a dispatch that came back with metadata as
 * well as an outcome.  Calling this function makes it behave the same as
 * calling `dispatch` directly.
 * @param meta the result of calling `dispatchWithMeta`
 * @returns a promise that resolves or rejects to the result of the action
 */
export const settle = (meta: MetaResult) => {
  const { outcome } = meta
  if (outcome.error) {
    return Promise.reject(deserializeError(outcome.error))
  } else {
    return Promise.resolve(outcome.result)
  }
}
