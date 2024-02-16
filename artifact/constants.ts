import { JSONSchemaType } from 'https://esm.sh/ajv@8.12.0'
import IsolateApi from './isolate-api.ts'
export { IsolateApi }
export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export enum PROCTYPE {
  SERIAL = 'serial',
  PARALLEL = 'parallel',
}
export const IO_PATH = '.io.json'
export type { JSONSchemaType }

export type JsonValue = string | number | boolean | null | JsonValue[] | {
  [key: string]: JsonValue
}
export type IsolateReturn = JsonValue | void

export type IsolateFunction =
  | (() => unknown | Promise<unknown>)
  | ((...args: [Params]) => unknown | Promise<unknown>)
  | ((...args: [Params, IsolateApi]) => unknown | Promise<unknown>)

export type IsolateFunctions = {
  [key: string]: IsolateFunction
}
export type IsolateLifecycle = {
  '@@mount': (api: IsolateApi) => Promise<IsolateReturn> | IsolateReturn
  '@@unmount'?: (api: IsolateApi) => Promise<IsolateReturn> | IsolateReturn
}

export type DispatchFunctions = {
  [key: string]: (
    params?: Params,
    proctype?: PROCTYPE,
  ) => unknown | Promise<unknown>
}
export type Params = Record<string, unknown>

export type IsolateApiSchema = {
  [key: string]: JSONSchemaType<any>
}
export type Isolate = {
  api: IsolateApiSchema
  functions: IsolateFunctions
  lifecycles?: IsolateLifecycle
}

export type IoStruct = {
  [PROCTYPE.SERIAL]: IoProctypeStruct
  [PROCTYPE.PARALLEL]: IoProctypeStruct
}
export type Outcome = { result?: unknown; error?: Error }
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
  branches: string[]
}

export type Poolable =
  | { type: 'REPLY'; payload: Reply }
  | { type: 'MERGE'; payload: Merge }
  | { type: 'DISPATCH'; payload: Dispatch }
  | { type: 'ORIGIN'; payload: Dispatch }

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
  outcome: Outcome
}
export type Dispatch = {
  pid: PID
  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
  /**
   * This should be a globally unique identifier for the dispatch.  It is used
   * to provide updates to the dispatch as it is processed, and to allow updates
   * to be continued during recovery.
   */
  nonce: string
  /**
   * Where did this dispatch come from? If this is blank, then it was self
   * originated, but if it has a value, then the reply gets copied across to
   * that process branch.
   */
  source?: PID
}

export enum QUEUE_TYPES {
  PULL = 'PULL',
  PUSH = 'PUSH',
  CLONE = 'CLONE',
  INIT = 'INIT',
  ISOLATE_API = 'ISOLATE_API',
  DISPATCH = 'DISPATCH',
}
export type QMessage = { nonce: string; name: string; params: Params }
export type QCallback = (
  msg: QMessage,
) => Promise<unknown> | unknown

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
  SERIAL = 'SERIAL',
}

export type HelpConfig = {
  model?: 'gpt-3.5-turbo-1106' | 'gpt-4-turbo-preview'
  temperature?: number
}
export type Help = {
  description?: string
  config?: HelpConfig
  runner?: string
  commands?: string[]
  instructions: string[]
  done?: string
  examples?: string[]
  tests?: string[]
}
