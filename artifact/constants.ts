import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { JSONSchemaType } from 'https://esm.sh/ajv@8.12.0'
import IsolateApi from './isolate-api.ts'
export { IsolateApi }
export type { CborUint8Array } from 'https://esm.sh/v135/json-joy@9.9.1/es6/json-pack/cbor/types.d.ts?exports=CbotUint8Array'
export enum PROCTYPE {
  SERIAL = 'SERIAL',
  BRANCH = 'BRANCH',
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
    options?: { branch?: boolean },
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

export type Outcome = { result?: unknown; error?: Error }
export type IoStruct = {
  sequence: number
  requests: { [key: string]: Request }
  replies: { [key: string]: Outcome }
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

export enum POOLABLE_TYPES {
  REPLY = 'REPLY',
  /**
   * The first action in a branch is the origin action, which will close the
   * branch once it is replied to.
   */
  DISPATCH = 'DISPATCH',
  /**
   * An external excitation.  When a reply is inserted for a pierce action, it
   * is up to the external watcher to take it from there.  In contrast when a
   * dispatch reply is received, then the execution layer needs to copy the
   * reply over to the source branch by way of a merge.
   */
  PIERCE = 'PIERCE',
}

export type Poolable = Request | Reply

export type Reply = {
  target: PID | Pierce
  sequence: number
  outcome: Outcome
  fs?: IFs
  commit?: string
}
export type Request = {
  target: PID
  source: PID | Pierce
  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
}
export type Pierce = {
  nonce: string
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
    dispatch: Request
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
