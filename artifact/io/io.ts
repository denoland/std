import { deserializeError, serializeError } from 'npm:serialize-error'
import ioWorker from './io-worker.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import debug from '$debug'
import Artifact from '../artifact.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  Dispatch,
  IO_PATH,
  IoStruct,
  Outcome,
  Parameters,
  PID,
  PROCTYPE,
  QueuedDispatch,
} from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Poolable } from '@/artifact/constants.ts'
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
    return this.#db.listenQueue(({ dispatch, sequence }: QueuedDispatch) => {
      log('queue', sequence, dispatch)
      assert(sequence >= 0, 'sequence must be a whole number')
      switch (dispatch.proctype) {
        case PROCTYPE.SERIAL: {
          return this.#processSerial(dispatch, sequence)
        }
        case PROCTYPE.PARALLEL: {
          // start the branch immediately without waiting for anyone
          // skip the first commit, since this is wasted
          // begin executing the isolate
          // commit the result to the branch
          // first off the dispatch to the newly created branch to be carried on
          return Promise.resolve()
        }
      }
    })
  }
  async #processSerial(dispatch: Dispatch, sequence: number) {
    await this.#db.awaitTail(dispatch.pid, sequence)
    const worker = await this.worker(dispatch.isolate)
    const fs = await this.#artifact.isolateFs(dispatch.pid)
    const api = IsolateApi.create(fs, this.#artifact)
    const actions = worker.actions(api)
    const outcome: Outcome = {}
    try {
      outcome.result = await actions[dispatch.functionName](dispatch.parameters)
      log('self result: %o', outcome.result)
    } catch (errorObj) {
      log('self error', errorObj)
      outcome.error = serializeError(errorObj)
    }
    await this.#replyIO(dispatch.pid, fs, outcome, sequence)
    await this.#db.tailDone(dispatch.pid, sequence)
    // must be last, and one event loop later, else fast tests will leak
    // if this fails, we need to bring back quiescence
    this.#db.announceOutcome(dispatch, outcome)
  }
  async #replyIO(pid: PID, fs: IFs, outcome: Outcome, sequence: number) {
    const nonce = `reply-${sequence}` // TODO try remove nonces altogether
    const payload = { pid, nonce, sequence, outcome }
    const reply: Poolable = { type: 'REPLY', payload }
    await this.#commitPool(pid, reply, fs)
  }
  async #commitPool(pid: PID, action: Poolable, fsToCommit?: IFs) {
    await this.#db.poolAction(action)
    const lockId = await this.#db.getHeadLock(pid, action) // make abortable
    if (!lockId) {
      return
    }
    const fs = await this.#artifact.isolateFs(pid)
    if (fsToCommit) {
      // TODO detect written files in the fs
      // TODO copy over files from fsToCommit that are not .io.json
    }

    const api = IsolateApi.create(fs, this.#artifact)
    const { keys, values } = await this.#db.getPooledActions(pid)
    const io = await updateIo(api, values)
    await git.add({ fs, dir: '/', filepath: IO_PATH })
    const hash = await git.commit({
      fs,
      dir: '/',
      message: 'pool',
      author: { name: 'IO' },
    })
    log('commitHash', hash)

    await this.#artifact.updateIsolateFs(pid, fs)
    await this.#db.enqueueIo(pid, io)

    await this.#db.deletePool(keys)
    await this.#db.releaseHeadlock(pid, lockId)
  }

  async dispatch(payload: Dispatch) {
    log('dispatch with isolate: %s', payload.isolate)
    const dispatch: Poolable = { type: 'DISPATCH', payload }
    await this.#commitPool(payload.pid, dispatch)
    let resolve!: (value: unknown) => void, reject!: (err: Error) => void
    const poolDrainedPromise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })
    const outcome = await this.#db.awaitOutcome(payload)
    log('outcome', outcome)
    if (!outcome.error) {
      resolve(outcome.result)
    } else {
      reject(deserializeError(outcome.error))
    }

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
}
const updateIo = async (api: IsolateApi, actions: Poolable[]) => {
  // the patch generation should be the same for io as for any splice.
  // this should be jsonpatch with some extra validation against a jsonschema

  log('updateIo')
  const io: IoStruct = {
    [PROCTYPE.SERIAL]: { sequence: 0, inputs: {}, outputs: {} },
    [PROCTYPE.PARALLEL]: { sequence: 0, inputs: {}, outputs: {} },
  }
  try {
    const priorIo = await api.readJSON(IO_PATH) // TODO check schema
    io[PROCTYPE.SERIAL].sequence = checkSequence(priorIo[PROCTYPE.SERIAL])
    io[PROCTYPE.PARALLEL].sequence = checkSequence(priorIo[PROCTYPE.PARALLEL])
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  for (const action of actions) {
    switch (action.type) {
      case 'REPLY': {
        const queue = io[PROCTYPE.SERIAL]
        const { sequence, outcome } = action.payload
        queue.outputs[sequence] = outcome
        break
      }
      case 'MERGE': {
        const queue = io[PROCTYPE.PARALLEL]
        // TODO copy over the inputs
        break
      }
      case 'DISPATCH': {
        const proctype = action.payload.proctype
        const queue = io[proctype]
        queue.inputs[queue.sequence++] = action.payload
        break
      }
    }
  }
  log('updateIo')
  api.writeJSON(IO_PATH, io)
  return io
}
const checkSequence = (io: { sequence: number }) => {
  assert(Number.isInteger(io.sequence), 'sequence must be an integer')
  assert(io.sequence >= 0, 'sequence must be a whole number')
  return io.sequence
}
