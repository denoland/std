import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import IsolateApi from './isolate-api.ts'
export type { IsolateApi }
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
export type Request = PierceRequest | SolidRequest | PoolRequest
export type Poolable = Request | InternalReply | MergeReply
export type Reply = PierceReply | InternalReply | MergeReply
type Invocation = {
  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
}
/**
 * A request made from inside an isolate, targetting the pool of a branch
 */
export type PoolRequest = Invocation & {
  target: PID
  source: PID
  /**
   * The index of the request in the accumulator for the currently executing
   * isolate, which caused this PoolRequest to be transmitted.
   */
  accumulation: number
}
/**
 * A request that has been included in a commit, therefore has a sequence number
 */
export type SolidRequest = Invocation & {
  target: PID
  source: PID
  sequence: number
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
export type IsolatePromise = {
  request: PoolRequest
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}
export * from './api/web-client.types.ts'
