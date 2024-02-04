export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
import { FsApi } from '@io/io-worker.ts'
export enum PROCTYPES {
  SELF = 'SELF',
  SPAWN = 'SPAWN',
}
export const IO_PATH = '.io.json'

export type JsonValue = string | number | boolean | null | JsonValue[] | {
  [key: string]: JsonValue
}
export type IsolateFunctions = {
  [key: string]: (
    arg?: { [key: string]: JsonValue },
    api?: FsApi,
  ) => JsonValue | Promise<JsonValue>
}
export type DispatchFunctions = {
  [key: string]: (
    arg?: { [key: string]: JsonValue },
  ) => JsonValue | Promise<JsonValue>
}
export type IsolateApi = { [key: string]: JsonValue }
export type Parameters = { [key: string]: JsonValue }

export type Isolate = {
  api: IsolateApi
  functions: IsolateFunctions
}

export type IOType = {
  sequence: number
  inputs: { [key: number]: JsonValue }
  outputs: { [key: number]: JsonValue }
}
