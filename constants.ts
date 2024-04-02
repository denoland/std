import IsolateApi from './isolate-api.ts'
export type { IsolateApi }
export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export const IO_PATH = '.io.json'
import {
  Invocation,
  IsolateApiSchema,
  IsolateReturn,
  Outcome,
  Params,
  PID,
  PierceRequest,
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
  /**
   * If a request generates child requests, they are tracked here.  The commit
   * in each entry is the commit that caused the child requests to be generated.
   * This is used to replay by resetting the fs to that commit and doing a
   * replay.
   */
  pendings: {
    [key: number]: { commit: string; sequences: number[] }[]
  }
}
export type Request = PierceRequest | SolidRequest
export type Reply = SolidReply | MergeReply
export type Poolable = Request | Reply

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
  replies: MergeReply[]
}
export type Branched = {
  commit: string
  origin: SolidRequest
}
export type ExeResult = {
  settled?: {
    reply: SolidReply
    /**
     * The last filesystem that was modified during the execution run.  The FS
     * might have been bumped forwards if accumulations occurred.
     */
    fs: FS
  }

  pending?: {
    /** The commit that caused the requests to be generated */
    commit: string
    /** The requests that were generated by the latest round of execution */
    requests: SolidRequest[]
  }
}

export const isPierceRequest = (p: Request): p is PierceRequest => {
  return 'ulid' in p
}
export const isRequest = (poolable: Poolable): poolable is Request => {
  return 'proctype' in poolable
}
export const isMergeReply = (poolable: Reply): poolable is MergeReply => {
  return 'commit' in poolable
}
/**
 * Messages that go on the queue are one of four types.  Each on is an operation
 * that will result in a new commit, atomically.  Each operation is able to
 * detect when it is a duplicate task due to duplicate message delivery.  Each
 * task will continue to retry until it is successful, as long as its check for
 * duplication reassures it to keep trying.
 */
export type QueueMessage = QueuePierce | QueueRequest | QueueBranch | QueueReply

export type QueuePierce = {
  pierce: PierceRequest
}
export type QueueRequest = {
  request: SolidRequest
  commit: string
}
export type QueueBranch = {
  parentCommit: string
  parentPid: PID
  sequence: number
}
export type QueueReply = {
  reply: MergeReply
}
export const isQueuePierce = (m: QueueMessage): m is QueuePierce => {
  return 'pierce' in m
}
export const isQueueRequest = (m: QueueMessage): m is QueueRequest => {
  return 'request' in m
}
export const isQueueBranch = (m: QueueMessage): m is QueueBranch => {
  return 'parentPid' in m
}
export const isQueueReply = (m: QueueMessage): m is QueueReply => {
  return 'reply' in m
}

export * from './api/web-client.types.ts'
