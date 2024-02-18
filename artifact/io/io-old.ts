import { deserializeError, serializeError } from 'npm:serialize-error'
import Compartment from './compartment.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import { Debug } from '@utils'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  IO_PATH,
  IoStruct,
  Outcome,
  PID,
  PROCTYPE,
  Request,
} from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Poolable } from '@/artifact/constants.ts'
import FS from '@/artifact/fs.ts'
const log = Debug('AI:io')

export default class IO {
  #db!: DB
  #fs!: FS
  static create(db: DB) {
    const io = new IO()
    io.#db = db
    io.#fs = FS.create(db)
    return io
  }
  async dispatch(payload: Request) {
    log('dispatch with isolate: %s', payload.isolate)
    const dispatch: Poolable = { type: 'DISPATCH', payload }

    const outcome = new Promise((resolve, reject) => {
      this.#db.awaitOutcome(payload).then((outcome: Outcome) => {
        log('outcome', outcome)
        if (!outcome.error) {
          resolve(outcome.result)
        } else {
          reject(deserializeError(outcome.error))
        }
      })
    })
    await this.#commitPool(payload.target, dispatch)

    return outcome
  }
  async #commitPool(pid: PID, poolable: Poolable, fsToCommit?: IFs) {
    await this.#db.poolAction(poolable) // BUT what if the message is redelivered ?
    const lockId = await this.#db.getHeadLock(pid, poolable)
    if (!lockId) {
      log('no lock required')
      return
    }
    const fs = await this.#fs.isolateFs(pid)
    if (fsToCommit) {
      // TODO detect written files in the fs
      // TODO copy over files from fsToCommit that are not .io.json
    }

    const api = IsolateApi.create(fs)
    const { keys, actions } = await this.#db.getPooledActions(pid)
    const { io, merges } = await updateIo(api, actions)

    let parent
    if (merges.length > 0) {
      const head = await git.resolveRef({ fs, dir: '/', ref: 'HEAD' })
      parent = [head, ...merges]
    }

    await git.add({ fs, dir: '/', filepath: IO_PATH })
    const hash = await git.commit({
      fs,
      dir: '/',
      message: 'pool',
      author: { name: 'IO' },
      parent,
    })
    log('commitHash', hash)

    await this.#fs.updateIsolateFs(pid, fs)
    await this.#db.deletePool(keys)
    await this.#enqueueIo(io)
    // TODO enqueue should await until the db had recorded the message, and then
    // after headlock is released, it should await the outcome, so that errors
    // bubble up to the caller
    await this.#db.releaseHeadlock(pid, lockId)
  }
  async #enqueueIo(io: IoStruct) {
    await Promise.all([
      this.#enqueueSerial(io[PROCTYPE.SERIAL]),
      this.#enqueueParallel(io[PROCTYPE.PARALLEL]),
    ])
  }
  async #enqueueSerial(serial: IoStruct[PROCTYPE.SERIAL]) {
    const ascendingKeys = sort(Object.keys(serial.inputs))
    log('enqueueSerial: %o', ascendingKeys)
    for (const key of ascendingKeys) {
      const dispatch = serial.inputs[key]
      const sequence = parseInt(key)
      await this.#db.enqueueSerial(dispatch, sequence)
    }
  }
  async processSerial(dispatch: Request, sequence: number) {
    await this.#db.awaitTail(dispatch.target, sequence)
    const compartment = Compartment.create(dispatch.isolate)
    const memfs = await this.#fs.isolateFs(dispatch.target)
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
    await this.#db.serialDone(dispatch.target, sequence)
    await this.#serialReply(dispatch.target, memfs, outcome, sequence)
    this.#db.announceOutcome(dispatch, outcome)
    return outcome
  }
  async #serialReply(pid: PID, fs: IFs, outcome: Outcome, sequence: number) {
    const nonce = `reply-${sequence}` // TODO try remove nonces altogether
    log('replyIO', nonce)
    const payload = { pid, nonce, sequence, outcome }
    const reply: Poolable = { type: 'REPLY', payload }
    await this.#commitPool(pid, reply, fs)

    // if this is the origin reply, then we need push one higher
  }
  async #enqueueParallel(parallel: IoStruct[PROCTYPE.PARALLEL]) {
    log('enqueueParallel %o', Object.keys(parallel.inputs))
    for (const key in parallel.inputs) {
      const dispatch = parallel.inputs[key]
      const sequence = parseInt(key)
      let branchName
      const length = dispatch.pid.branches.length
      if (length === 1) {
        branchName = `${sequence}`
      } else {
        const last = dispatch.pid.branches.slice(-1).pop()
        branchName = `${last}-${sequence}`
      }
      const branches = dispatch.pid.branches.concat(branchName)
      const pid: PID = { ...dispatch.pid, branches }
      log('enqueueParallel %o', pid)
      const nonce = `para_${sequence}`
      const proctype = PROCTYPE.SERIAL
      const origin: Request = { ...dispatch, target, proctype, nonce }
      await this.#db.enqueueParallel(origin, sequence)
    }
  }
  /**
   * Process:
   * - get the pid lock
   * - commit the origin action to .io.json
   * - engage the serial processing function
   * - when a reply to origin is completed,
   */
  async processParallel(dispatch: Request, sequence: number) {
    assert(sequence === 0, 'sequence must be 0')
    assert(dispatch.target.branches.length > 1, 'branches must be more than 1')
    // TODO handle this being a duplicate message delivery

    const branches = dispatch.target.branches.slice(0, -1)
    const parent: PID = { ...dispatch.target, branches }
    const fs = await this.#fs.isolateFs(parent)
    const ref = dispatch.target.branches.slice(-1).pop() as string
    await git.branch({ fs, dir: '/', ref, checkout: true })
    await this.#fs.updateIsolateFs(dispatch.target, fs)

    const poolable: Poolable = { type: 'ORIGIN', payload: dispatch }
    // if we got the headlock before commit, then is safer ?
    await this.#commitPool(dispatch.target, poolable)
    // TODO want the pooling effect, but want to do it in band without a message

    Debug.enable('*')
    log('processParallel', dispatch.nonce)
    const outcome = await this.processSerial(dispatch, sequence)

    // TODO process the IPC actions from the api collector
    await this.#parallelReply(parent, fs, sequence, outcome)
    this.#db.announceOutcome(dispatch, outcome)
    // begin executing the isolate
    // commit the result to the branch
    // first off the dispatch to the newly created branch to be carried on
  }
  async #parallelReply(
    source: PID,
    fs: IFs,
    sequence: number,
    outcome: Outcome,
  ) {
    const nonce = `reply-${sequence}` // TODO try remove nonces altogether
    log('parallelReply', nonce)
    const branches = source.branches.slice(0, -1)
    const pid = { ...source, branches }
    const payload = { pid, nonce, sequence, source, outcome }
    const reply: Poolable = { type: 'MERGE', payload }
    await this.#commitPool(pid, reply, fs)

    // write direct to the parent in a merge
    // we want to do a merge but with an outcome in it
    // the outcome needs to be copied over
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
    log('io file not found')
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  actions.sort((a: Poolable, b: Poolable) => {
    if (a.type === 'ORIGIN') {
      return -1
    }
    if (b.type === 'ORIGIN') {
      return 1
    }
    return 0
  })
  const merges: string[] = []
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
        log('merge', action.payload)

        // pass in the commit that is to be merged, rather than head ?
        // copy over the objects
        // mention the hash of the commit we want to merge
        // summarize these in the retval so we can add them as parents

        // delete the branch that we merged in from

        // TODO copy over the inputs
        break
      }
      case 'DISPATCH': {
        const proctype = action.payload.proctype
        const queue = io[proctype]
        queue.inputs[queue.sequence++] = action.payload
        break
      }
      case 'ORIGIN': {
        const proctype = action.payload.proctype
        const queue = io[proctype]
        assert(queue.sequence === 0, 'origin must be the first action')
        queue.inputs[queue.sequence++] = action.payload
        break
      }
    }
  }
  log('updateIo')
  api.writeJSON(IO_PATH, io)
  return { io, merges }
}
const checkSequence = (io: { sequence: number }) => {
  assert(Number.isInteger(io.sequence), 'sequence must be an integer')
  assert(io.sequence >= 0, 'sequence must be a whole number')
  return io.sequence
}
const sort = (keys: string[]) => keys.sort((a, b) => parseInt(a) - parseInt(b))
