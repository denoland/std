import { deserializeError, serializeError } from 'npm:serialize-error'
import equals from 'npm:fast-deep-equal'
import ioWorker from './io-worker.ts'
import { assert } from 'std/assert/mod.ts'
import git, { TREE } from '$git'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { toString } from 'npm:uint8arrays/to-string'
import { debug } from '$debug'
import Artifact from '../artifact.ts'
import {
  IO_PATH,
  IOType,
  JsonValue,
  Parameters,
  PROCTYPES,
} from '../constants.ts'
const log = debug('AI:io')
export const defaultBranch = 'main'

export interface DispatchParams {
  repo: string
  branch: string
  args: DispatchArgs
}
interface DispatchArgs {
  isolate: string
  name: string
  parameters: Parameters
  proctype: PROCTYPES
}

export default class IO {
  #artifact!: Artifact
  #workerCache = new Map()
  #promises = new Map() // path -> promise ?
  #db: Deno.Kv | undefined
  static create(artifact: Artifact) {
    const io = new IO()
    io.#artifact = artifact
    return io
  }
  async start() {
    assert(!this.#db, 'already started')
    this.#db = await Deno.openKv()
    this.#db.listenQueue(async (action) => {
      const { type, payload } = action
      log('queue', type, payload)
      const { isolate, name, parameters, id } = payload
      // can the types be the same as the proctypes ?
      switch (type) {
        case PROCTYPES.SELF: {
          log('EXECUTE', { id, isolate, name, parameters })
          const worker = await this.worker(isolate)
          // ? do we have the branch lock ?
          const repo = 'somerepo'
          const branch = 'somebranch'
          const executor = await worker.snapshot(this.#artifact, repo, branch)
          const reply: { id: string; result?: JsonValue; error?: JsonValue } = {
            id,
          }
          try {
            reply.result = await executor(name, parameters)
            log('self result', reply.result)
          } catch (errorObj) {
            log('self error', errorObj)
            reply.error = serializeError(errorObj)
          }
          // await this.#replyIO(reply)
          return
        }
        case PROCTYPES.SPAWN: {
          log('spawning', isolate, name, parameters)
          // await this.#spawn({ id, isolate, name, parameters })
          return
        }
      }
    })
  }
  stop() {
    assert(this.#db, 'not started')
    this.#db?.close()
  }

  async dispatch({ repo, branch, args }: DispatchParams) {
    const { isolate, name, parameters, proctype } = args
    log('dispatch', repo, branch)
    // but what we need is write lock
    // dispatch needs to call up a branch at random, from anywhere

    // ultimately we want a commit, then an enqueue action to work on that
    // commit

    // const { id, next } = input(io, action)
    // const branchName = await git.currentBranch(this.#opts)

    // let resolve, reject
    // const promise = new Promise((res, rej) => {
    //   resolve = res
    //   reject = rej
    // })
    // const pid = `${branchName}_${id}`
    // log('dispatch pid', pid)
    // assert(!this.#promises.has(pid), `pid ${pid} already exists`)
    // this.#promises.set(pid, { resolve, reject })

    // await this.#commitIO(next, 'dispatch')
    // return promise
    return Promise.resolve(null)
  }
  async #spawn(id: number, isolate: string, name: string, params: Parameters) {
    // const branchName = await git.currentBranch(this.#opts)
    // const action = { isolate, name, params, proctype: PROCTYPES.SELF }
    // action.address = { branchName, id }

    // const [{ oid }] = await git.log({ ...this.#opts, depth: 1 })
    // const ref = `${oid}-${id}`
    // await git.branch({ ...this.#opts, ref, checkout: true })
    // log('spawn', ref, action)
    // await this.#artifact.rm(IO_PATH)
    // await this.#artifact.rm('/chat-1.session.json')
    // const io = await this.readIO()
    // const { next } = input(io, action)
    // await this.#commitIO(next, 'spawn')
  }
  async workerApi(isolate: string) {
    const { api } = await this.#ensureWorker(isolate)
    return api
  }
  async worker(isolate: string) {
    const { worker } = await this.#ensureWorker(isolate)
    return worker
  }
  async #ensureWorker(isolate: string) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    if (!this.#workerCache.has(isolate)) {
      // TODO handle the isolate changing
      // TODO isolate by branch as well as name
      // TODO store the hash of the isolate file we loaded in a lock file
      log('ensureWorker', isolate)
      const { worker, api } = await this.#loadWorker(isolate)
      this.#workerCache.set(isolate, { worker, api })
    }
    return this.#workerCache.get(isolate)
  }
  async #loadWorker(isolate: string) {
    log('loadWorker', isolate)
    const worker = ioWorker()
    const api = await worker.load(isolate)
    return { worker, api }
  }
  // the patch generation should be the same for io as for any splice.
  // this should be jsonpatch with some extra validation against a jsonschema
}
