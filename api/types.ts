// copied from the artifact project
import { z, type ZodSchema } from 'zod'
export type { AssistantMessage, CompletionMessage } from '../openai/zod.ts'
import { completionMessage } from '../openai/zod.ts'
import type { Backchat } from './client-backchat.ts'
import { assert } from '@std/assert'
import type OpenAI from 'openai'
import { randomness } from './randomness.ts'
export { randomness }
type CommitOid = string

export const md5 = z.string().regex(/^[a-f0-9]{40}$/, 'Invalid MD5 hash')

export type Change = {
  /** If present, represents the unified diff of the file at the given path,
   * since the last commit.  This is only provided if the file is a string.  If
   * the changes are too large, this will be missing and an oid will be provided.
   */
  patch?: string
  /**
   * The oid of the object given by path, which can be used to fetch the object
   * directly. If this file is binary, then patch will be missing, and the file
   * should be directly retrieved.  If oid is missing, then the change was
   * fatal.
   */
  oid?: string
}
export type Splice = {
  pid: PID
  /**
   * The hash of the commit object
   */
  oid: string
  /**
   * The commit this splice refers to
   */
  commit: CommitObject
  /**
   * The timestamp of the commit, or if transient, the timestamp of the write
   * that caused this update
   */
  timestamp: number
  changes: { [key: string]: Change }
}
export declare interface EventSourceMessage {
  /** The data received for this message. */
  data: string
  /** Event name sent from the server, or `undefined` if none is set for this message. */
  event?: string
  /** ID of the message, if any was provided by the server. */
  id?: string
}
/**
 * A git commit object.
 */
export type CommitObject = {
  /**
   * Commit message
   */
  message: string
  /**
   * SHA-1 object id of corresponding file tree
   */
  tree: string
  /**
   * an array of zero or more SHA-1 object ids
   */
  parent: string[]
  author: {
    /**
     * The author's name
     */
    name: string
    /**
     * The author's email
     */
    email: string
    /**
     * UTC Unix timestamp in seconds
     */
    timestamp: number
    /**
     * Timezone difference from UTC in minutes
     */
    timezoneOffset: number
  }
  committer: {
    /**
     * The committer's name
     */
    name: string
    /**
     * The committer's email
     */
    email: string
    /**
     * UTC Unix timestamp in seconds
     */
    timestamp: number
    /**
     * Timezone difference from UTC in minutes
     */
    timezoneOffset: number
  }
  /**
   * PGP signature (if present)
   */
  gpgsig?: string
}

export interface EngineInterface {
  /**
   * The address in use as basis of identity for this engine.  May be a repo
   * hosted on external engines, or hosted in cooperation with other engines.
   */
  homeAddress: PID
  abortSignal: AbortSignal
  upsertBackchat(machineId: string, resume?: string): Promise<PID>
  stop(): Promise<void> | void
  /**
   * Send a ping to the edge isolate that will process requests, to establish
   * basic network connectivity. To ping a chain, use an isolate.
   * TODO ping should return some info about the deployment
   * @param data Data that will be echoed back
   */
  ping(data?: JsonValue): Promise<IsolateReturn>
  apiSchema(isolate: string): Promise<Record<string, object>>
  transcribe(audio: File): Promise<{ text: string }>
  pierce(pierce: Pierce): Promise<void>
  watch(
    pid: PID,
    path?: string,
    after?: string,
    signal?: AbortSignal,
  ): AsyncIterable<Splice>
  splice(
    target: PID,
    opts?: { commit?: string; path?: string; count?: number },
  ): Promise<Splice[]>
  read(path: string, pid: PID, commit?: string): Promise<string>
  readTree(path: string, pid: PID, commit?: string): Promise<TreeEntry[]>
  readJSON<T>(path: string, pid: PID, commit?: string): Promise<T>
  readBinary(path: string, pid?: PID, commit?: string): Promise<Uint8Array>
  exists(path: string, pid: PID): Promise<boolean>
}

export const generateBackchatId = () => {
  return 'bac_' + randomness()
}

export const backchatStateSchema = z.object({
  /** The base thread that this backchat session points to - the thread of last resort */
  target: pidSchema,
  threadCount: z.number().int().gte(0),
})
