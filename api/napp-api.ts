import type { ZodRecord, ZodTypeAny } from 'zod'
import { z } from 'zod'
import type { NappTypes } from './napps-list.ts'
import { type Action, jsonSchema, type JsonValue } from './actions.ts'
import Debug from 'debug'
import type { Outcome } from './actions.ts'
import { deserializeError } from 'serialize-error'
const log = Debug('@artifact/api')

export type TreeEntry = {
  /** the 6 digit hexadecimal mode */
  mode: string
  /** the name of the file or directory */
  path: string
  /** the hash identifier of the blob or tree */
  oid: string
  /** the type of object */
  type: 'blob' | 'tree'
  /** the snapshot identifier, since lookup by oid is not permitted as there is
   * no way to lookup permissions cheaply */
  snapshot: string
}

export type Upsert =
  | { meta: { snapshot: string; path: string } }
  | { json: JsonValue } // TODO implement object cache using structured clone
  | { text: string }
  | { data: Uint8Array }

export const optionsSchema = z.object({
  process: z.string().optional(),
  crypto: z.string().optional(),
  branch: z.string().optional(),
  snapshot: z.string().optional(),
})
export type AddressedOptions = {
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
  /** Depending on the snapshot format being used, represents the state at a
   * specific point in the history.  For write commands, snapshot is used to
   * guarantee the state being changed has not been altered since it was read */
  snapshot?: string
}

export interface NappSnapshots<ReadOptions = AddressedOptions> {
  latest(options?: Omit<ReadOptions, 'snapshot'>): Promise<string | undefined>
  parents(options?: ReadOptions): Promise<string[]>
  history(options?: ReadOptions & { count?: number }): Promise<string[]>
}

export interface NappRead<ReadOptions = AddressedOptions> {
  meta(path: string, options?: ReadOptions): Promise<TreeEntry>
  json<T extends ZodTypeAny = typeof jsonSchema>(
    path: string,
    options?: ReadOptions & { schema?: T },
  ): Promise<z.infer<T>>
  text(path: string, options?: ReadOptions): Promise<string>
  binary(path: string, options?: ReadOptions): Promise<Uint8Array>
  exists(path: string, options?: ReadOptions): Promise<boolean>
  ls(path?: string, options?: ReadOptions): Promise<TreeEntry[]>
}

export interface SnapshotsProvider<ReadOptions = AddressedOptions> {
  readonly snapshots: NappSnapshots<ReadOptions>
  readonly read: NappRead<ReadOptions>
  commit(upserts: Map<string, Upsert>, deletes: Set<string>): Promise<void>
}

export interface NappWrite<WriteOptions = AddressedOptions> {
  json(
    path: string,
    content: JsonValue,
    options?: WriteOptions,
  ): Promise<void>
  text(
    path: string,
    content: string,
    options?: WriteOptions,
  ): Promise<void>
  binary(
    path: string,
    content: Uint8Array,
    options?: WriteOptions,
  ): Promise<void>
  rm(path: string, options?: WriteOptions): Promise<void>
  mv(
    from: WriteOptions & { path: string },
    to: WriteOptions & { path: string },
  ): Promise<void>
  cp(
    from: WriteOptions & { path: string },
    to: WriteOptions & { path: string },
  ): Promise<void>
}

type SpawnOptions =
  & AddressedOptions
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

type MetaResult = { meta: Required<AddressedOptions>; outcome: Outcome }

interface NappProcesses {
  /** start a new process and install the given napp. */
  spawn(napp: keyof NappTypes, options: SpawnOptions): Promise<void>
  /** tear down the specified process, and resturn the result of teardown */
  kill(options: AddressedOptions): Promise<JsonValue | undefined>
  /** spawns a new process, installs the napp specified in the action, awaits
   * the execution, and then returns, killing the process */
  async(action: Action, options: SpawnOptions): Promise<JsonValue | undefined>
  /** move a process to another parent.  Can be used to daemonize a running
   * process by moving it to be a child of init */
  mv(to: AddressedOptions, from?: AddressedOptions): Promise<void>
  /** change the priority of a process */
  nice(level: number, options: AddressedOptions): void

  dispatch(
    action: Action,
    options: AddressedOptions,
  ): Promise<JsonValue | undefined | void>
  dispatchWithMeta(
    action: Action,
    options: AddressedOptions,
  ): Promise<MetaResult>
}

export const stateSchema = z.record(jsonSchema)

/** State is stored in the process json files */
interface NappState<ReadOptions = AddressedOptions> {
  get<T extends ZodRecord = typeof stateSchema>(
    options: ReadOptions & { schema?: T; fallback?: z.infer<T> },
  ): Promise<z.infer<T>>
  // TODO return metadata of the state so we know if a part remains unchanged
  // TODO allow fetching paths within the state
  set<T extends ZodRecord = typeof stateSchema>(
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

export class FileNotFoundError extends Error {
  code = 'ENOENT'
  constructor(path: string) {
    super('Could not find file or directory: ' + path)
    this.name = 'FileNotFoundError'
  }
}
export class LineageError extends Error {
  code = 'EINVALID'
  constructor(id: string) {
    super('Lineage fault for: ' + id)
    this.name = 'LineageError'
  }
}
