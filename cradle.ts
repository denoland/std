import { diffChars } from '$diff'
import Compartment from './io/compartment.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import git from '$git'
import {
  Cradle,
  DispatchFunctions,
  Params,
  PID,
  PierceRequest,
  Request,
  Splice,
} from './constants.ts'
import { pidFromRepo } from '@/keys.ts'
import { getProcType } from '@/constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert } from 'std/assert/assert.ts'
import { Debug } from '@utils'
import { ulid } from 'std/ulid/mod.ts'
import Queue from './queue.ts'
import { C } from './isolates/artifact.ts'
import { transcribe } from '@/runners/runner-chat.ts'
import { ProcessOptions } from '@/constants.ts'
const log = Debug('AI:cradle')

export class QueueCradle implements Cradle {
  #compartment!: Compartment
  #api!: IsolateApi<C>
  #queue!: Queue
  static async create() {
    const cradle = new QueueCradle()
    cradle.#compartment = await Compartment.create('artifact')
    // TODO use a super PID as the cradle PID for all system actions
    cradle.#api = IsolateApi.createContext()
    cradle.#api.context.self = cradle
    await cradle.#compartment.mount(cradle.#api)
    assert(cradle.#api.context.db, 'db not found')

    const functions = cradle.#compartment.functions(cradle.#api)
    assert(!functions.stop, 'stop is a reserved action')
    assert(!functions.dispatches, 'dispatches is a reserved action')
    cradle.#queue = Queue.create(functions, cradle.#api)
    return cradle
  }
  async stop() {
    for (const abort of this.#aborts) {
      abort.abort()
    }
    await Promise.all([...this.#readPromises])
    await this.#compartment.unmount(this.#api)
    await this.#queue.quiesce()
  }
  async pierces(isolate: string, target: PID) {
    // cradle side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params?: Params,
        options?: ProcessOptions,
      ) => {
        log('pierces %o', functionName)
        const proctype = getProcType(options)
        const pierce: PierceRequest = {
          target,
          ulid: ulid(),
          isolate,
          functionName,
          params: params || {},
          // TODO pass the process options straight thru ?
          proctype,
        }
        return this.pierce(pierce)
      }
    }
    log('dispatches:', isolate, Object.keys(pierces))
    return pierces
  }
  async ping(params?: Params) {
    params = params || {}
    type K = ReturnType<Cradle['ping']>
    const result = await this.#queue.push<K>('ping', params)
    return result
  }
  async probe(params: { repo: string }) {
    type K = ReturnType<Cradle['probe']>
    const result = await this.#queue.push<K>('probe', params)
    return result as { pid: PID; head: string } | void
  }
  async init(params: { repo: string }) {
    type K = ReturnType<Cradle['init']>
    const result = await this.#queue.push<K>('init', params)
    return result as { pid: PID; head: string }
  }
  async clone(params: { repo: string }) {
    type K = ReturnType<Cradle['clone']>
    const result = await this.#queue.push<K>('clone', params)
    assert(result, 'clone result not found')
    return result
  }
  async rm(params: { repo: string }) {
    type K = ReturnType<Cradle['rm']>
    const result = await this.#queue.push<K>('rm', params)
    return result
  }
  apiSchema(params: { isolate: string }) {
    return this.#api.isolateApiSchema(params.isolate)
  }
  async pierce(params: PierceRequest) {
    // TODO move this to be a splice watching function
    try {
      type K = ReturnType<Cradle['pierce']>
      return await this.#queue.push<K>('pierce', params)
    } catch (error) {
      throw error
    } finally {
      // if we are in test mode, quiesce the queue before returning
      if (this.#api.context.db!.isTestMode) {
        await this.#queue.quiesce()
      }
    }
  }
  async transcribe(params: { audio: File }) {
    const text = await transcribe(params.audio)
    return { text }
  }
  request(params: { request: Request; commit: string; prior?: number }) {
    const detach = true
    return this.#queue.push('request', params, detach)
  }
  branch(params: { branch: PID; commit: string }) {
    return this.#queue.push('branch', params)
  }
  async logs(params: { repo: string }) {
    log('logs', params.repo)
    const pid = pidFromRepo(params.repo)
    const fs = await this.#api.context.fs!.load(pid)
    const logs = await git.log({ fs, dir: '/' })
    return logs
  }
  #aborts = new Set<AbortController>()
  #readPromises = new Set<Promise<void>>()
  #waiter(abort: AbortController) {
    let resolve: () => void
    const readPromise = new Promise<void>((_resolve) => {
      resolve = _resolve
    })
    this.#readPromises.add(readPromise)
    this.#aborts.add(abort)
    return () => {
      resolve()
      this.#readPromises.delete(readPromise)
      this.#aborts.delete(abort)
    }
  }
  read(pid: PID, path?: string, signal?: AbortSignal) {
    // buffer transients until we get up to the current commit
    // if we pass the current commit in transients, reset what head is
    // TODO use commit logs to ensure we emit one splice for every commit
    assert(!path || !posix.isAbsolute(path), `path must be relative: ${path}`)

    const abort = new AbortController()
    if (signal) {
      signal.addEventListener('abort', () => {
        abort.abort()
      })
    }
    const finished = this.#waiter(abort)

    let last: string
    const commits = this.#api.context.db!.watchHead(pid, abort.signal)

    const toSplices = new TransformStream<string, Splice>({
      transform: async (oid, controller) => {
        log('commit', oid, path)
        const fs = await this.#api.context.fs!.load(pid)
        log('fs loaded')
        const { commit } = await git.readCommit({ fs, dir: '/', oid })
        let changes
        if (path) {
          log('read path', path)
          const api = IsolateApi.createFS(fs, oid)
          const exists = await api.exists(path)
          if (exists) {
            log('file exists', path, oid)
            const content = await api.read(path)
            if (last === undefined && last !== content) {
              log('content changed')
              // TODO use json differ for json
              changes = diffChars(last || '', content)
              last = content
            }
          }
        }

        const timestamp = commit.committer.timestamp * 1000
        const splice: Splice = { pid, oid, commit, timestamp, path, changes }
        controller.enqueue(splice)
      },
    })
    commits.pipeTo(toSplices.writable)
      .then(() => {
        log('pipeTo done')
      }).catch((_error) => {
        // silence as only used during testing
      })
      .then(() => {
        finished()
        log('stream complete')
      })
    return toSplices.readable
  }
}

export default QueueCradle
