import IsolateContext from './isolate-api.ts'

export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export enum PROCTYPE {
  SERIAL = 'serial',
  PARALLEL = 'parallel',
}
export const IO_PATH = '.io.json'

export type JsonValue = string | number | boolean | null | JsonValue[] | {
  [key: string]: JsonValue
}
type IsolateApiFunctions = {
  [key: string]: (
    arg?: { [key: string]: JsonValue },
    api?: IsolateContext,
  ) => JsonValue | Promise<JsonValue>
}
export type IsolatedFunctions = {
  [key: string]: (
    parameters?: Parameters,
  ) => JsonValue | Promise<JsonValue>
}
export type DispatchFunctions = {
  [key: string]: (
    parameters?: { [key: string]: JsonValue },
    proctype?: PROCTYPE,
  ) => unknown | Promise<unknown> // dispatch returns can be undefined
}
export type Parameters = { [key: string]: JsonValue }

export type IsolateApiSchema = {
  [key: string]: {
    [key: string]: JsonValue
  }
}
export type Isolate = {
  api: IsolateApiSchema
  functions: IsolateApiFunctions
}

export type IoStruct = {
  [PROCTYPE.SERIAL]: IoProctypeStruct
  [PROCTYPE.PARALLEL]: IoProctypeStruct
}
export type Outcome = { result?: JsonValue; error?: string }
export type IoProctypeStruct = {
  sequence: number
  inputs: { [key: string]: Dispatch }
  outputs: { [key: string]: Outcome }
}
export const ENTRY_BRANCH = 'main'
/**
 * The Process Identifier used to address a specific process branch.
 */
export type PID = {
  account: string
  repository: string
  branches: [string, ...string[]]
}

export type Poolable =
  | { type: 'REPLY'; payload: Reply }
  | { type: 'MERGE'; payload: Merge }
  | { type: 'DISPATCH'; payload: Dispatch }

export type Reply = {
  pid: PID
  nonce: string
  sequence: number
  outcome: Outcome
}
export type Merge = {
  pid: PID
  nonce: string
  sequence: number
  source: PID
}
export type Dispatch = {
  pid: PID
  isolate: string
  functionName: string
  parameters: Parameters
  proctype: PROCTYPE
  /**
   * This should be a globally unique identifier for the dispatch.  It is used
   * to provide updates to the dispatch as it is processed, and to allow updates
   * to be continued during recovery.
   */
  nonce: string
}

export enum QUEUE_TYPES {
  PULL = 'PULL',
  PUSH = 'PUSH',
  CLONE = 'CLONE',
  INIT = 'INIT',
  ISOLATE_API = 'ISOLATE_API',
  DISPATCH = 'DISPATCH',
}
export type QueuedMessage = QueuedCommit | QueuedDispatch
export type QueuedDispatch = {
  type: QUEUE_TYPES.DISPATCH
  payload: {
    dispatch: Dispatch
    sequence: number
  }
}

export type QueuedCommit = {
  type: 'COMMIT'
  payload: {
    pid: PID
    hash: string
  }
}
export enum KEYSPACES {
  POOL = 'POOL', // all pending IO actions trying to be committed
  HEADLOCK = 'HEADLOCK', // the lock on the head of a given process branch
  REPO = 'REPO', // this is the latest fs snapshot of a given process branch
  /**
   * Sequential actions that need to execute in order.  Has the form:
   *
   * [KEYSPACES.SERIAL, account, repository, ...branches, sequence] => true
   *
   * When completed, the key is deleted, which allows the next dispatch to begin
   * execution.
   */
  TAIL = 'TAIL',
}

export interface Artifact {
  pull(repo: string): Promise<void>
  push(repo: string): Promise<void>
  clone(repo: string): Promise<void>
  init(repo: string): Promise<void>
  isolateApi(isolate: string): Promise<IsolateApiSchema>
  actions(isolate: string, pid: PID): Promise<DispatchFunctions>

  // then need things like subscribing to fs updates in a pid, reading files,
  // but it should all be handled by subscribing to splices / patches ?
  // also subscribe to binary / read binary
}
