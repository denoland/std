import { deserializeError, serializeError } from 'npm:serialize-error'
import Compartment from './compartment.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import debug from '$debug'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  Dispatch,
  IO_PATH,
  IoStruct,
  Outcome,
  Params,
  PID,
  PROCTYPE,
} from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Poolable } from '@/artifact/constants.ts'
import FS from '@/artifact/fs.ts'
const log = debug('AI:io')

export default class IO {
  #db!: DB
  #fs!: FS
  static create(db: DB) {
    const io = new IO()
    io.#db = db
    io.#fs = FS.create(db)
    return io
  }
  async #processSerial(dispatch: Dispatch, sequence: number) {
    await this.#db.awaitTail(dispatch.pid, sequence)
    const compartment = Compartment.create(dispatch.isolate)
    const memfs = await this.#fs.isolateFs(dispatch.pid)
    const api = IsolateApi.create(memfs)
    const functions = compartment.functions(api)
    const outcome: Outcome = {}
    try {
      outcome.result = await functions[dispatch.functionName](dispatch.params)
      log('self result: %o', outcome.result)
    } catch (errorObj) {
      log('self error', errorObj)
      outcome.error = serializeError(errorObj)
    }
    // TODO process the IPC actions from the api collector
    await this.#db.tailDone(dispatch.pid, sequence)
    await this.#replyIO(dispatch.pid, memfs, outcome, sequence)
    this.#db.announceOutcome(dispatch, outcome)
  }
  async #processParallel() {
    // start the branch immediately without waiting for anyone
    // skip the first commit, since this is wasted
    // begin executing the isolate
    // commit the result to the branch
    // first off the dispatch to the newly created branch to be carried on
  }
  async dispatch(payload: Dispatch) {
    log('dispatch with isolate: %s', payload.isolate)
    const dispatch: Poolable = { type: 'DISPATCH', payload }

    const outcome = new Promise((resolve, reject) => {
      // must start listening asap for BroadcastChannel to work
      this.#db.awaitOutcome(payload).then((outcome: Outcome) => {
        log('outcome', outcome)
        if (!outcome.error) {
          resolve(outcome.result)
        } else {
          reject(deserializeError(outcome.error))
        }
      })
    })
    await this.#commitPool(payload.pid, dispatch)

    return outcome
  }
  async #replyIO(pid: PID, fs: IFs, outcome: Outcome, sequence: number) {
    const nonce = `reply-${sequence}` // TODO try remove nonces altogether
    log('replyIO', nonce)
    const payload = { pid, nonce, sequence, outcome }
    const reply: Poolable = { type: 'REPLY', payload }
    await this.#commitPool(pid, reply, fs)
  }
  async #commitPool(pid: PID, poolable: Poolable, fsToCommit?: IFs) {
    await this.#db.poolAction(poolable)
    const lockId = await this.#db.getHeadLock(pid, poolable)
    if (!lockId) {
      return
    }
    const fs = await this.#fs.isolateFs(pid)
    if (fsToCommit) {
      // TODO detect written files in the fs
      // TODO copy over files from fsToCommit that are not .io.json
    }

    const api = IsolateApi.create(fs)
    const { keys, actions } = await this.#db.getPooledActions(pid)
    const io = await updateIo(api, actions)
    await git.add({ fs, dir: '/', filepath: IO_PATH })
    const hash = await git.commit({
      fs,
      dir: '/',
      message: 'pool',
      author: { name: 'IO' },
    })
    log('commitHash', hash)

    await this.#fs.updateIsolateFs(pid, fs)
    await this.#enqueueIo(pid, io)

    await this.#db.deletePool(keys)
    await this.#db.releaseHeadlock(pid, lockId)
  }
  async #enqueueIo(pid: PID, io: IoStruct) {
    await Promise.all([
      this.#enqueueSerial(pid, io[PROCTYPE.SERIAL]),
      this.#enqueueParallel(pid, io[PROCTYPE.PARALLEL]),
    ])
  }
  async #enqueueSerial(pid: PID, serial: IoStruct[PROCTYPE.SERIAL]) {
    const ascendingKeys = sort(Object.keys(serial.inputs))
    log('enqueueSerial %o', ascendingKeys)
    for (const key of ascendingKeys) {
      const dispatch = serial.inputs[key]
      const sequence = parseInt(key)
      await this.#db.enqueueTail(dispatch, sequence)
    }
  }
  async #enqueueParallel(
    pid: PID,
    parallel: IoStruct[PROCTYPE.PARALLEL],
  ) {
    throw new Error('not implemented')
  }
  async #spawn(id: number, isolate: string, name: string, params: Params) {
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
const sort = (keys: string[]) => keys.sort((a, b) => parseInt(a) - parseInt(b))
