import { deserializeError, serializeError } from 'npm:serialize-error'
import ioWorker from './io-worker.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
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
import DB from '@/artifact/db.ts'
const log = debug('AI:io')

export default class IO {
  #artifact!: Artifact
  #db!: DB
  #workerCache = new Map()
  static create(artifact: Artifact, db: DB) {
    const io = new IO()
    io.#artifact = artifact
    io.#db = db
    return io
  }
  listen() {
    // TODO be able to pause the queue processing for debugging
    this.#db.listenQueue(async (dispatch: DispatchParams) => {
      log('queue', dispatch)

      const { pid, isolate, functionName, parameters, proctype } = dispatch
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
            result = await actions[functionName](parameters)
            log('self result', result)
          } catch (errorObj) {
            log('self error', errorObj)
            error = serializeError(errorObj)
          }
          await this.#replyIO(pid, result, error)
          return
        }
        case PROCTYPES.SPAWN: {
          log('spawning', isolate, functionName, parameters)
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

  // { pid, isolate, name, parameters, proctype }
  async dispatch(action: DispatchParams) {
    if (!this.#db) {
      throw new Error('not running')
    }
    log('dispatch with isolate: %s', action.isolate)

    const tailCommit = await this.#db.getTailCommit(action.pid)
    log('tailCommit:', tailCommit)

    const db = this.#db
    const poolDrainedPromise = new Promise((resolve, reject) => {
      const poolDrained = () => {
        log('poolDrained')
        // walk back the commits to get the result out
        resolve(undefined)
      }
      const watcher = async () => {
        const poolStream = await db.watchPool(action)
        for await (const [event] of poolStream) {
          log('pool event')
          if (!event.versionstamp) {
            poolDrained()
            return
          }
        }
      }
      watcher()
    })

    const lockId = await db.getHeadLock(action.pid) // send in an abort controller so we can cancel
    const fs = await this.#artifact.isolateFs(action.pid)
    const headApi = IsolateApi.create(fs, this.#artifact)
    const { keys, values } = await this.#db.getPooledActions(action.pid)
    await updateIo(headApi, values)
    await git.add({ fs, dir: '/', filepath: IO_PATH })
    const commitHash = await git.commit({
      fs,
      dir: '/',
      message: 'dispatch',
      author: { name: 'IO' },
    })
    log('commitHash', commitHash)

    await this.#artifact.updateIsolateFs(action.pid, fs)
    await this.#db.enqueue({ type: 'COMMIT', pid: action.pid, commitHash })

    // blank the processed pool items
    await this.#db.deletePool(keys)
    await this.#db.releaseHeadlock(action.pid, lockId)

    return poolDrainedPromise
    // Should do an action for dispatch since io results need to dispatch
    // too, and their thread would have just spent max time running their
    // function, and might be exhausted.
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
const updateIo = async (api: IsolateApi, actions: DispatchParams[]) => {
  log('updateIo')
  let io: IOType = {
    sequence: 0,
    inputs: {},
    outputs: {},
  }
  try {
    io = await api.readJSON(IO_PATH) // TODO check schema
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  let { sequence } = io
  const nextInputs = { ...io.inputs }
  for (const action of actions) {
    nextInputs[sequence++] = action
  }
  const nextIo = { sequence, inputs: nextInputs, outputs: io.outputs }
  log('updateIo')
  api.writeJSON(IO_PATH, nextIo)
}
