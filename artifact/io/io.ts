import { deserializeError, serializeError } from 'npm:serialize-error'
import ioWorker from './io-worker.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from '$debug'
import Artifact from '../artifact.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  Dispatch,
  IO_PATH,
  IoStruct,
  JsonValue,
  Parameters,
  PROCTYPES,
} from '../constants.ts'
import { ProcessAddress } from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { delay } from 'https://deno.land/std@0.211.0/async/delay.ts'
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
    this.#db.listenQueue(async (dispatch: Dispatch) => {
      log('queue', dispatch)

      switch (dispatch.proctype) {
        case PROCTYPES.SELF: {
          // await this.#db.tail()
          // run our isolate
          // pool the result
          // delete the tail

          return
        }
        case PROCTYPES.SPAWN: {
          // start the branch immediately without waiting for anyone
          // skip the first commit, since this is wasted
          // begin executing the isolate
          // commit the result to the branch
          // first off the dispatch to the newly created branch to be carried on
        }
      }
    })
  }
  processing() {
    // case PROCTYPES.SELF: {
    //   const worker = await this.worker(isolate)
    //   // get threadlock on the branch
    //   // in the background start loading up the memfs stack

    //   // make the isolated memfs
    //   const fs = await this.#artifact.isolateFs(pid)
    //   const api = IsolateApi.create(fs, this.#artifact)
    //   const actions = worker.actions(api)
    //   let result, error
    //   try {
    //     result = await actions[functionName](parameters)
    //     log('self result', result)
    //   } catch (errorObj) {
    //     log('self error', errorObj)
    //     error = serializeError(errorObj)
    //   }
    //   await this.#replyIO(pid, result, error)
    //   return
    // }
    // case PROCTYPES.SPAWN: {
    //   log('spawning', isolate, functionName, parameters)
    //   // await this.#spawn({ id, isolate, name, parameters })
    //   return
    // }
  }
  async #replyIO(pid: ProcessAddress, result?: JsonValue, error?: string) {
    // const io = await this.readIO()
    // const { sequence, outputs } = io
    // const next = { sequence: sequence + 1, inputs: { ...outputs, [sequence]: result } }
    // await this.#commitIO(next, 'reply')
  }

  async dispatch(action: Dispatch) {
    log('dispatch with isolate: %s', action.isolate)
    const { pid } = action

    const db = this.#db
    const poolDrainedPromise = new Promise((resolve, reject) => {
      const poolDrained = async () => {
        log('poolDrained')
        // walk back the commits to get the result out
        // update when it is commited
        // update with it is started running
        // do not follow the branch, but know how to walk it
        // update when the output is commited
        await delay(100)
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

    const lockId = await db.getHeadLock(pid) // send in an abort controller so we can cancel
    const fs = await this.#artifact.isolateFs(pid)
    const headApi = IsolateApi.create(fs, this.#artifact)
    const { keys, values } = await this.#db.getPooledActions(pid)
    const io = await updateIo(headApi, values)
    await git.add({ fs, dir: '/', filepath: IO_PATH })
    const hash = await git.commit({
      fs,
      dir: '/',
      message: 'dispatch',
      author: { name: 'IO' },
    })
    log('commitHash', hash)

    await this.#artifact.updateIsolateFs(pid, fs)

    await this.#db.enqueueIo(pid, io)

    // blank the processed pool items
    await this.#db.deletePool(keys)
    await this.#db.releaseHeadlock(pid, lockId)

    return poolDrainedPromise
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
const updateIo = async (api: IsolateApi, actions: Dispatch[]) => {
  // we could delete teh IO of the current commit, since nobody needs it now ?
  log('updateIo')
  const io: IoStruct = {
    sequence: 0,
    inputs: {},
    outputs: {},
  }
  try {
    const priorIo = await api.readJSON(IO_PATH) // TODO check schema
    assert(Number.isInteger(priorIo.sequence), 'sequence must be an integer')
    assert(priorIo.sequence >= 0, 'sequence must be a whole number')
    io.sequence = priorIo.sequence
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  for (const action of actions) {
    io.inputs[io.sequence++] = action
  }
  log('updateIo')
  api.writeJSON(IO_PATH, io)
  return io
}
