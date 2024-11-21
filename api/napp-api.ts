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
  readonly mode: string
  /** the name of the file or directory */
  readonly path: string
  /** the hash identifier of the blob or tree */
  readonly oid: string
  /** the type of object */
  readonly type: 'blob' | 'tree'
  /** the snapshot identifier, since lookup by oid is not permitted as there is
   * no way to lookup permissions cheaply */
  readonly snapshot: string
}

export type Upsert =
  | { readonly meta: { readonly snapshot: string; readonly path: string } }
  | { readonly json: JsonValue } // TODO implement object cache using structured clone
  | { readonly text: string }
  | { readonly data: Uint8Array }

export const addressSchema = z
  .object({
    /** Posix style path that locates what process thread we want to communicate
     * with. In git, this would be branch names, for example: `exe/proc-1/child-2` */
    process: z.string(),
    /** The cryptographic identifier of the whole repository. This would be the
     * chainId in conventional blockchains, but could be a group of public keys,
     * or some other root of trust */
    crypto: z.string(),
    /** Whatever snapshot model is used, the branch concept represents an isolated
     * line of changes. In git, this would be a branch */
    branch: z.string(),
    /** Depending on the snapshot format being used, represents the state at a
     * specific point in the history. For write commands, snapshot is used to
     * guarantee the state being changed has not been altered since it was read */
    snapshot: z.string(),
  })
  .partial()

export type Address = z.infer<typeof addressSchema>

export interface NappSnapshots<ReadOptions = Address> {
  /** Posix style path that locates what process thread we want to communicate
   * with. In git, this would be branch names, for example: `exe/proc-1/child-2` */
  readonly latest: (
    options?: Omit<ReadOptions, 'snapshot'>,
  ) => Promise<string | undefined>
  readonly parents: (options?: ReadOptions) => Promise<string[]>
  readonly history: (
    options?: ReadOptions & { count?: number },
  ) => Promise<string[]>
}

export interface NappRead<ReadOptions = Address> {
  readonly meta: (path: string, options?: ReadOptions) => Promise<TreeEntry>
  readonly json: <T extends ZodTypeAny = typeof jsonSchema>(
    path: string,
    options?: ReadOptions & { schema?: T },
  ) => Promise<z.infer<T>>
  readonly text: (path: string, options?: ReadOptions) => Promise<string>
  readonly binary: (path: string, options?: ReadOptions) => Promise<Uint8Array>
  readonly exists: (path: string, options?: ReadOptions) => Promise<boolean>
  readonly ls: (path?: string, options?: ReadOptions) => Promise<TreeEntry[]>
}

export interface SnapshotsProvider<ReadOptions = Address> {
  readonly snapshots: NappSnapshots<ReadOptions>
  readonly read: NappRead<ReadOptions>
  readonly commit: (
    upserts: Map<string, Upsert>,
    deletes: Set<string>,
  ) => Promise<void>
}

export interface NappWrite<WriteOptions = Address> {
  readonly json: (
    path: string,
    content: JsonValue,
    options?: WriteOptions,
  ) => Promise<void>
  readonly text: (
    path: string,
    content: string,
    options?: WriteOptions,
  ) => Promise<void>
  readonly binary: (
    path: string,
    content: Uint8Array,
    options?: WriteOptions,
  ) => Promise<void>
  readonly rm: (path: string, options?: WriteOptions) => Promise<void>
  readonly mv: (
    from: WriteOptions & { path: string },
    to: WriteOptions & { path: string },
  ) => Promise<void>
  readonly cp: (
    from: WriteOptions & { path: string },
    to: WriteOptions & { path: string },
  ) => Promise<void>
}

type SpawnOptions =
  & Address
  & (
    | { readonly name: string; prefix?: never }
    | { name?: never; readonly prefix: string }
  )
  & {
    readonly files?: string[]
    /** If process exists, exit gracefully */
    readonly upsert?: boolean
    /** Priority of the process */
    readonly nice?: number
  }

type MetaResult = {
  readonly meta: Required<Address>
  readonly outcome: Outcome
}

interface NappProcesses {
  /** start a new process and install the given napp. */
  readonly spawn: (
    napp: keyof NappTypes,
    options: SpawnOptions,
  ) => Promise<void>
  /** tear down the specified process, and resturn the result of teardown */
  readonly kill: (options: Address) => Promise<JsonValue>
  /** spawns a new process, installs the napp specified in the action, awaits
   * the execution, and then returns, killing the process */
  readonly async: (action: Action, options: SpawnOptions) => Promise<JsonValue>
  /** move a process to another parent.  Can be used to daemonize a running
   * process by moving it to be a child of init */
  readonly mv: (to: Address, from?: Address) => Promise<void>
  /** change the priority of a process */
  readonly nice: (level: number, options: Address) => void

  readonly dispatch: (
    action: Action,
    options: Address,
  ) => Promise<JsonValue | void>
  readonly dispatchWithMeta: (
    action: Action,
    options: Address,
  ) => Promise<MetaResult>
}

export const stateSchema = z.record(jsonSchema)

/** State is stored in the process json files */
interface NappState<ReadOptions = Address> {
  readonly get: <T extends ZodRecord = typeof stateSchema>(
    options: ReadOptions & { schema?: T; fallback?: z.infer<T> },
  ) => Promise<z.infer<T>>
  // TODO return metadata of the state so we know if a part remains unchanged
  // TODO allow fetching paths within the state
  readonly set: <T extends ZodRecord = typeof stateSchema>(
    state: z.infer<T>,
    options: ReadOptions & { schema?: T },
  ) => Promise<void>
}

interface NappEffects {
  /** Side effects can listen to this signal to abort their activities */
  readonly signal: AbortSignal

  /** If the side effect lock was broken in order to start this instance.
   * Implies the previous executing instance was aborted */
  readonly isEffectRecovered: boolean

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
