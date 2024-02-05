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

export type IOType = {
  sequence: number
  inputs: { [key: number]: JsonValue }
  outputs: { [key: number]: JsonValue }
}
export const ENTRY_BRANCH = 'main'
export type ProcessAddress = {
  account: string
  repository: string
  branches: [string, ...string[]]
}
export type DispatchParams = {
  pid: ProcessAddress
  isolate: string
  functionName: string
  parameters: Parameters
  proctype: PROCTYPES
}

export enum KEYSPACES {
  POOL = 'POOL', // all pending actions trying to be committed
  HEADLOCK = 'HEADLOCK', // the lock on the head of a given process branch
  REPO = 'REPO', // this is the latest fs snapshot of a given process branch
  TIP = 'TIP', // the commit the branch is up to for parallel processing
  TAIL = 'TAIL', // the commit the branch is up to for sequential processing
}
