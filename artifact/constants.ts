import IsolateApi from './isolate-api.ts'

export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export enum PROCTYPES {
  SELF = 'SELF',
  SPAWN = 'SPAWN',
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
    proctype?: PROCTYPES,
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
  sequence: number
  inputs: { [key: string]: Dispatch }
  outputs: { [key: string]: { result?: JsonValue; error: string } }
}
export const ENTRY_BRANCH = 'main'
export type ProcessAddress = {
  account: string
  repository: string
  branches: [string, ...string[]]
}
export type Dispatch = {
  pid: ProcessAddress
  isolate: string
  functionName: string
  parameters: Parameters
  proctype: PROCTYPES
}
export type QueuedDispatch = {
  dispatch: Dispatch
  sequence: number
  /**
   * If the dispatch is a sequential process type, this is the key of the item
   * before it to wait for.
   */
  priorKey?: string[]
}

export enum KEYSPACES {
  POOL = 'POOL', // all pending actions trying to be committed
  HEADLOCK = 'HEADLOCK', // the lock on the head of a given process branch
  REPO = 'REPO', // this is the latest fs snapshot of a given process branch
  TAIL = 'TAIL', // sequential actions that need to execute in order
}

export type QueuedMessage = QueuedCommit

export type QueuedCommit = {
  type: 'COMMIT'
  pid: ProcessAddress
  hash: string
}
