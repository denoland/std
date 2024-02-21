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
  [key: string]: JSONSchemaType<object>
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

export type Poolable = Request | InternalReply | MergeReply
export type Request = PierceRequest | InternalRequest
export type Reply = PierceReply | InternalReply | MergeReply
export type PierceRequest = {
  target: PID
  ulid: string

  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
}
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
