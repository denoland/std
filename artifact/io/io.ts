import { deserializeError, serializeError } from 'npm:serialize-error'
import equals from 'npm:fast-deep-equal'
import ioWorker from './io-worker.ts'
import { assert } from 'std/assert/mod.ts'
import git, { TREE } from '$git'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { toString } from 'npm:uint8arrays/to-string'
import { debug } from '$debug'
import Artifact from '../artifact.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  DispatchParams,
  IO_PATH,
  IOType,
  JsonValue,
  Parameters,
  PROCTYPES,
} from '../constants.ts'
import { ProcessAddress } from '@/artifact/constants.ts'
const log = debug('AI:io')

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
    this.#db.listenQueue(async (dispatch: DispatchParams) => {
      log('queue', dispatch)

      const { pid, isolate, name, parameters, proctype } = dispatch
      switch (proctype) {
        case PROCTYPES.SELF: {
          const worker = await this.worker(isolate)
          // get threadlock on the branch
          // in the background start loading up the memfs stack

          // make the isolated memfs
          const fs = await this.#artifact.isolateFs(pid)
          const api = IsolateApi.create(fs, this.#artifact)
          const actions = worker.actions(api)
          let result, error
          try {
            result = await actions[name](parameters)
            log('self result', result)
          } catch (errorObj) {
            log('self error', errorObj)
            error = serializeError(errorObj)
          }
          await this.#replyIO(pid, result, error)
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
  async #replyIO(pid: ProcessAddress, result?: JsonValue, error?: string) {
    // const io = await this.readIO()
    // const { sequence, outputs } = io
    // const next = { sequence: sequence + 1, inputs: { ...outputs, [sequence]: result } }
    // await this.#commitIO(next, 'reply')
  }
  stop() {
    assert(this.#db, 'not started')
    this.#db?.close()
  }

  // { pid, isolate, name, parameters, proctype }
  async dispatch({ pid, isolate, name, parameters, proctype }: DispatchParams) {
    log('dispatch')

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
