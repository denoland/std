import IsolateApi from './isolate-api.ts'

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
    api?: IsolateApi,
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
export type IoProctypeStruct = {
  sequence: number
  inputs: { [key: string]: Dispatch }
  outputs: { [key: string]: { result?: JsonValue; error: string } }
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
export type Dispatch = {
  pid: PID
  isolate: string
  functionName: string
  parameters: Parameters
  proctype: PROCTYPE
}
export type QueuedDispatch = {
  dispatch: Dispatch
  sequence: number
}

export enum KEYSPACES {
  POOL = 'POOL', // all pending actions trying to be committed
  HEADLOCK = 'HEADLOCK', // the lock on the head of a given process branch
  REPO = 'REPO', // this is the latest fs snapshot of a given process branch
  /**
   * sequential actions that need to execute in order
   */
  TAIL = 'TAIL',
}

export type QueuedMessage = QueuedCommit

export type QueuedCommit = {
  type: 'COMMIT'
  pid: PID
  hash: string
}
