import IA from './isolate-api.ts'
export type { IA }
export const IO_PATH = '.io.json'
import {
  type Backchat,
  Change,
  CommitObject,
  EngineInterface,
  IsolateReturn,
  MetaPromise,
  Outcome,
  Params,
  PID,
  Pierce,
  RemoteRequest,
  Request,
  SolidRequest,
  UnsequencedRequest,
} from './api/types.ts'
import FS from '@/git/fs.ts'
import type DB from '@/db.ts'
import type Executor from '@/exe/exe.ts'
import { assert, equal } from '@utils'
import { JsonSchema7ObjectType, zodToJsonSchema } from 'zod-to-json-schema'
import { ZodObject, ZodSchema, ZodUnknown } from 'zod'

export const REPO_LOCK_TIMEOUT_MS = 5000

export type IsolateLifecycle = {
  '@@mount'?: (api: IA) => Promise<IsolateReturn> | IsolateReturn
  '@@unmount'?: (api: IA) => Promise<IsolateReturn> | IsolateReturn
}

export type Solids = {
  oid: string
  commit: CommitObject
  /** Changed files in this commit.  Empty change signals deletion. */
  changes: { [key: string]: Change }
  exe?: { request: SolidRequest; sequence: number }
  branches: number[]
  poolables: (MergeReply | RemoteRequest)[]
  deletes: { pid: PID; commit: string }[]
}
export type Branched = {
  /** The first request in the new branch */
  origin: SolidRequest
  /** The branch PID that needs to be created in /.git/refs */
  pid: PID
  /** The head of the new branch that needs to be created in /.git/refs */
  head: string
}

/**
 * Messages that go on the queue are one of three types.  Each one is an
 * operation that will result in a new commit, atomically.  Each operation is
 * able to detect when it is a duplicate task due to duplicate message delivery.
 * Each task will continue to retry until it is successful, as long as its check
 * for duplication reassures it to keep trying.
 */
export type QueueMessage = QueuePool | QueueExe | QueueBranch
export enum QueueMessageType {
  POOL = 'pool',
  EXECUTION = 'exe',
  BRANCH = 'branch',
}
export type QueuePool = {
  type: QueueMessageType.POOL
  pid: PID
}
export type QueueExe = {
  type: QueueMessageType.EXECUTION
  pid: PID
  commit: string
  sequence: number
}
export type QueueBranch = {
  type: QueueMessageType.BRANCH
  parentCommit: string
  parentPid: PID
  sequence: number
}
export const isQueuePool = (m: QueueMessage): m is QueuePool => {
  return m.type === QueueMessageType.POOL
}
export const isQueueExe = (m: QueueMessage): m is QueueExe => {
  return m.type === QueueMessageType.EXECUTION
}
export const isQueueBranch = (m: QueueMessage): m is QueueBranch => {
  return m.type === QueueMessageType.BRANCH
}
export const isChildOf = (child: PID, parent: PID) => {
  const childParent = { ...child, branches: child.branches.slice(0, -1) }
  return equal(childParent, parent)
}
export const isBaseRepo = (pid: PID) => pid.branches.length === 1
