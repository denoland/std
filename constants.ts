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
import FS from '@/git/fs.ts'

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
export type Request = PierceRequest | SolidRequest
export type Poolable = Request | SolidReply | MergeReply
export type Reply = PierceReply | SolidReply | MergeReply
type Invocation = {
  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
  /**
   * Allow a custom name for the new branch, if this is a branching request
   */
  branch?: string
  /**
   * If the custom branch name might not be unique, a prefix can be given and
   * the sequence number will be appended to the branch name, ensuring
   * uniqueness.
   */
  branchPrefix?: string
}
/**
 * A request that has been included in a commit, therefore has a sequence number
 */
export type SolidRequest = Invocation & {
  target: PID
  source: PID
  sequence: number
}
export type EffectRequest = {
  target: PID
  /**
   * The hash of the function that was called, to ensure repeatability
   */
  fingerprint: string
  sequence: number
}
export type PierceReply = {
  ulid: string
  outcome: Outcome
}
export type SolidReply = {
  target: PID
  sequence: number
  outcome: Outcome
}
export type MergeReply = {
  target: PID
  /**
   * Where did this merge reply come from?
   */
  source: PID
  sequence: number
  outcome: Outcome
  /**
   * What is the commit that solidified this merge reply?
   */
  commit: string
}
export type IsolatePromise = {
  outcome?: Outcome
  request: SolidRequest
  resolve?: (value: unknown) => void
  reject?: (error: Error) => void
}
export type Solids = {
  commit: string
  request?: SolidRequest
  branches: number[]
  replies: Reply[]
}
export type ExeResult = {
  settled?: {
    reply: SolidReply
    /**
     * The last filesystem that was modified during the execution run.  The FS
     * might have been bumped forwards if accumulations occured.
     */
    fs: FS
  }
  pending?: { requests: SolidRequest[] }
}
export const isPierceRequest = (p: Request): p is PierceRequest => {
  return 'ulid' in p
}
export const toRunnableRequest = (request: Request, sequence: number) => {
  if (!isPierceRequest(request)) {
    return request
  }
  const { isolate, functionName, params, proctype, target } = request
  const internal: SolidRequest = {
    isolate,
    functionName,
    params,
    proctype,
    source: target,
    target,
    sequence,
  }
  return internal
}
export const isRequest = (poolable: Poolable): poolable is Request => {
  return 'proctype' in poolable
}
export const isMergeReply = (poolable: Reply): poolable is MergeReply => {
  return 'commit' in poolable
}
export const isPierceReply = (reply: Reply): reply is PierceReply => {
  return ('ulid' in reply)
}
export * from './api/web-client.types.ts'
