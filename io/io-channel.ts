/**
 * Manages the .io.json file
 */

import { assert, Debug, equal } from '@utils'
import {
  IoStruct,
  isPierceRequest,
  isRequest,
  MergeReply,
  PID,
  PROCTYPE,
  Reply,
  Request,
  SolidReply,
  SolidRequest,
  UnsequencedRequest,
} from '@/constants.ts'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { IsolatePromise } from '@/constants.ts'
const log = Debug('AI:io-file')

const createBase = (): IoStruct => ({
  sequence: 0,
  requests: {},
  replies: {},
  pendings: {},
})

export default class IOChannel {
  readonly #io: IoStruct
  readonly #fs: FS | undefined
  readonly #pid: PID
  #original: IoStruct
  private constructor(io: IoStruct, pid: PID, fs?: FS) {
    // TODO remove the fs item completely - handle fs outside
    this.#io = io
    this.#pid = pid
    if (fs) {
      assert(equal(pid, fs.pid), 'pid mismatch')
    }
    this.#fs = fs
    // TODO use immer or similar to avoid this problem
    this.#original = JSON.parse(JSON.stringify(io))
  }
  static readObject(io: IoStruct, pid: PID) {
    return new IOChannel(io, pid)
  }
  static async read(fs: FS) {
    if (await fs.exists('.io.json')) {
      const io = await fs.readJSON<IoStruct>('.io.json')
      check(io)
      return new IOChannel(io, fs.pid, fs)
    }
  }
  static async load(fs: FS) {
    let io = createBase()

    if (await fs.exists('.io.json')) {
      io = await fs.readJSON('.io.json') as IoStruct
      check(io)
      blankSettledRequests(io, fs.pid)
    }
    return new IOChannel(io, fs.pid, fs)
  }
  static blank(fs: FS) {
    const io = new IOChannel(createBase(), fs.pid, fs)
    io.#save()
  }
  #save() {
    if (!this.#fs) {
      throw new Error('no filesystem to save to')
    }
    return this.#fs.writeJSON('.io.json', this.#io)
  }
  save() {
    if (equal(this.#io, this.#original)) {
      throw new Error('no changes to save')
    }
    this.#original = JSON.parse(JSON.stringify(this.#io))
    return this.#save()
  }
  /**
   * @returns true if there are any requests that are accumulating, as in they
   * have no replies yet, but are needed to continue execution
   */
  isAccumulating() {
    return !!this.getNextSerialRequest()
  }
  isNextSerialRequest(attempt: SolidRequest) {
    const next = this.getNextSerialRequest()
    return equal(next, attempt)
  }
  getNextSerialRequest() {
    const unreplied = Object.keys(this.#io.requests)
      .filter((k) => !this.#io.replies[k])
      .map((key) => parseInt(key))
      .sort((a, b) => a - b)

    // grab the first one with no reply that has all its pendings ready to go

    for (const key of unreplied) {
      const request = this.#io.requests[key]
      if (request.proctype !== PROCTYPE.SERIAL) {
        continue
      }
      if (!this.#io.pendings[key]) {
        return toRunnableRequest(request, key)
      }
      const pendings = this.#io.pendings[key]
      const lastLayer = pendings[pendings.length - 1]
      if (lastLayer.sequences.every((sequence) => this.isSettled(sequence))) {
        return toRunnableRequest(request, key)
      }
    }
  }
  getSequence(request: SolidRequest) {
    for (const [key, value] of Object.entries(this.#io.requests)) {
      const test = toRunnableRequest(value, Number.parseInt(key))
      if (equal(test, request)) {
        return Number.parseInt(key)
      }
    }
    throw new Error('request not found')
  }
  getRequest(sequence: number) {
    assert(sequence in this.#io.requests, 'sequence not found')
    return this.#io.requests[sequence]
  }
  reply(reply: SolidReply | MergeReply) {
    const { sequence } = reply
    assert(Number.isInteger(sequence), 'reply needs a sequence number')
    assert(sequence >= 0, 'reply needs a whole sequence number')

    const request = this.#io.requests[sequence]
    assert(request, `reply sequence not found: ${sequence}`)
    assert(!this.#io.replies[sequence], 'sequence already replied')
    this.#io.replies[sequence] = reply.outcome
    if (!isAccumulation(request, this.#pid)) {
      this.#blankAccumulations()
    }
    return request
  }
  #blankAccumulations() {
    // TODO this must honour multiple requests underway, so scope the blanking
    // to a specific request that is being ended
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#pid)) {
        assert(this.#io.replies[key], 'accumulation without reply')
        delete this.#io.requests[key]
        delete this.#io.replies[key]
      }
    }
  }
  getAccumulator(): Accumulator {
    const indices: number[] = []
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#pid)) {
        indices.push(Number.parseInt(key))
      }
    }
    indices.sort((a, b) => a - b)
    const accumulations: IsolatePromise[] = []
    for (const index of indices) {
      const saved = this.#io.requests[index]
      assert(!isPierceRequest(saved), 'pierce request cannot accumulate')
      const request = toUnsequenced(saved)
      const outcome = this.#io.replies[index]
      const result: IsolatePromise = { request, outcome }
      accumulations.push(result)
    }
    return Accumulator.create(accumulations)
  }
  print() {
    return JSON.stringify(this.#io, null, 2)
  }
  get isExecuting() {
    // find a request that is serial and has no corresponding reply
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (!equal(request.target, this.#pid)) {
        continue
      }
      if (request.proctype !== PROCTYPE.SERIAL) {
        continue
      }
      if (this.#io.replies[key]) {
        continue
      }
      return true
    }
    return false
  }
  // TODO clean up pending slice when replies completed
  // TODO consider pending splice to skip exhausted requests
  includes(poolable: Reply | SolidRequest) {
    assert(equal(poolable.target, this.#pid), 'target mismatch')
    if (isRequest(poolable)) {
      const { sequence } = poolable
      if (this.#io.requests[sequence]) {
        assert(equal(this.#io.requests[sequence], poolable), 'mismatch')
        return true
      }
      if (this.#io.sequence > sequence) {
        return true
      }
      return false
    } else {
      const { sequence } = poolable
      if (this.#io.replies[sequence]) {
        const check = equal(this.#io.replies[sequence], poolable.outcome)
        assert(check, 'reply mismatch')
        return true
      }
      if (this.#io.sequence > sequence) {
        return true
      }
      return false
    }
  }
  isSettled(sequence: number) {
    assert(this.#io.sequence > sequence, 'sequence not yet invoked')
    if (!this.#io.requests[sequence]) {
      return true
    }
    if (this.#io.replies[sequence]) {
      return true
    }
    return false
  }
  isPendingIncluded(sequence: number, commit: string) {
    const pendings = this.#io.pendings[sequence]
    if (!pendings) {
      return false
    }
    return pendings.some((pending) => pending.commit === commit)
  }
  getBranchPid(sequence: number) {
    const request = this.getRequest(sequence)
    const branchTypes = [PROCTYPE.BRANCH, PROCTYPE.DAEMON]
    assert(branchTypes.includes(request.proctype), 'not a branch request')

    let name = sequence + ''
    if (request.branch) {
      assert(!request.branchPrefix, 'cannot have both branch and branchPrefix')
      name = request.branch
    }
    if (request.branchPrefix) {
      assert(!request.branch, 'cannot have both branch and branchPrefix')
      name = request.branchPrefix + '-' + sequence
    }
    const parentPid = this.#pid
    const branches = [...parentPid.branches, name]
    const pid = { ...parentPid, branches }
    return pid
  }
  addRequest(request: Request) {
    const sequence = this.#io.sequence++
    this.#io.requests[sequence] = request
    return sequence
  }
  addPending(commit: string, requests: UnsequencedRequest[]) {
    const executing = this.getNextSerialRequest()
    // TODO affirm this is actually the executing request ?
    assert(executing, 'no executing request')
    const sequence = this.getSequence(executing)

    const sequences = []
    const solidRequests: SolidRequest[] = []
    for (const request of requests) {
      const { sequence, sequenced } = this.#addUnsequenced(request)
      sequences.push(sequence)
      solidRequests.push(sequenced)
    }
    if (!this.#io.pendings[sequence]) {
      this.#io.pendings[sequence] = []
    }
    this.#io.pendings[sequence].push({ commit, sequences })
    return solidRequests
  }
  #addUnsequenced(request: UnsequencedRequest) {
    const sequence = this.#io.sequence++
    const source = this.#pid
    const sequenced: SolidRequest = { ...request, sequence, source }
    this.#io.requests[sequence] = sequenced
    return { sequence, sequenced }
  }
}

const check = (io: IoStruct) => {
  // TODO check format
  // TODO check key sequences are sane
  // TODO do the same for reply values
  for (const replyKey of Object.keys(io.replies)) {
    assert(replyKey in io.requests, 'no reply key in requests')
  }
}
const blankSettledRequests = (io: IoStruct, thisPid: PID) => {
  const toBlank = []
  for (const key in io.replies) {
    if (!isAccumulation(io.requests[key], thisPid)) {
      toBlank.push(key)
    }
  }
  for (const key of toBlank) {
    delete io.requests[key]
    delete io.replies[key]
    log('deleted', key)
  }
}
/** An accumulation is an action sourced from this branch */
const isAccumulation = (request: Request, thisPid: PID) => {
  if (isPierceRequest(request)) {
    return false
  }
  if (equal(thisPid, request.source)) {
    return true
  }
  return false
}

const toRunnableRequest = (request: Request, sequence: number) => {
  // TODO remove this function completely - translation is bad
  if (!isPierceRequest(request)) {
    return request
  }
  const { isolate, functionName, params, proctype, target } = request
  const internal: SolidRequest = {
    isolate,
    functionName,
    params,
    proctype,
    source: target,
    target,
    sequence,
  }
  return internal
}
export const toUnsequenced = (request: SolidRequest): UnsequencedRequest => {
  const { sequence: _, source: __, ...unsequenced } = request
  return unsequenced
}
