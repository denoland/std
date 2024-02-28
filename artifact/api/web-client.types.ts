// copied from the artifact project
import { JSONSchemaType } from './web-client.ajv.ts'
export enum PROCTYPE {
  SERIAL = 'SERIAL',
  BRANCH = 'BRANCH',
}
export type { JSONSchemaType }

export type JsonValue =
  | undefined
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
    [key: string]: JsonValue
  }
export type IsolateReturn = JsonValue | void

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

export type Outcome = { result?: unknown; error?: Error }
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

export type PierceRequest = {
  target: PID
  ulid: string

  isolate: string
  functionName: string
  params: Params
  proctype: PROCTYPE
}
export interface Cradle {
  ping(params?: Params): Promise<IsolateReturn>
  apiSchema(params: { isolate: string }): Promise<Record<string, object>>
  pierce(params: PierceRequest): Promise<unknown>
  transcribe(params: { audio: File }): Promise<{ text: string }>
  logs(params: { repo: string }): Promise<object[]>
  pierces(isolate: string, target: PID): Promise<DispatchFunctions>
  stop(): Promise<void> | void
  // TODO should move these git functions elsewhere ?
  init(params: { repo: string }): Promise<{ pid: PID }>
  clone(params: { repo: string }): Promise<{ pid: PID }>
}
