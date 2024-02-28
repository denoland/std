import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import IsolateApi from './isolate-api.ts'
export { IsolateApi }
export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export const IO_PATH = '.io.json'
import {
  IsolateApiSchema,
  IsolateReturn,
  Outcome,
  Params,
  PID,
  PierceRequest,
  PROCTYPE,
} from './api/web-client.types.ts'
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
export type Isolate = {
  api: IsolateApiSchema
  functions: IsolateFunctions
  lifecycles?: IsolateLifecycle
}
export type IoStruct = {
  sequence: number
  requests: { [key: string]: Request }
  replies: { [key: string]: Outcome }
}
export type Request = PierceRequest | InternalRequest
export type Poolable = Request | InternalReply | MergeReply
export type Reply = PierceReply | InternalReply | MergeReply
export type InternalRequest = {
  target: PID
  source: PID
  sequence: number

  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
}
export type PierceReply = {
  ulid: string
  outcome: Outcome
}
export type InternalReply = {
  target: PID
  sequence: number
  outcome: Outcome
}
export type MergeReply = {
  target: PID
  sequence: number
  outcome: Outcome
  fs: IFs
  commit: string
}
export * from './api/web-client.types.ts'
