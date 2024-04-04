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
  PierceRequest,
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
  readonly #fs: FS
  #original: IoStruct
  private constructor(io: IoStruct, fs: FS) {
    this.#io = io
    this.#fs = fs
    this.#original = JSON.parse(JSON.stringify(io))
  }
  static async read(fs: FS) {
    if (await fs.exists('.io.json')) {
      const io = await fs.readJSON<IoStruct>('.io.json')
      check(io)
      return new IOChannel(io, fs)
    }
  }
  static async load(fs: FS) {
    let io = createBase()

    if (await fs.exists('.io.json')) {
      io = await fs.readJSON('.io.json') as IoStruct
      check(io)
      blankSettledRequests(io, fs.pid)
    }
    return new IOChannel(io, fs)
  }
  static blank(fs: FS) {
    const io = new IOChannel(createBase(), fs)
    io.#save()
  }
  #save() {
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
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#fs.pid)) {
        if (!this.#io.replies[key]) {
          return true
        }
      }
    }
    return false
  }
  isCallable(attempt: SolidRequest) {
    if (this.isAccumulating()) {
      return false
    }
    // TODO assert this is the first serial request to be called
    const sequence = this.getSequence(attempt)
    return this.#io.replies[sequence] === undefined
  }
  getExecutingRequest() {
    if (this.isAccumulating()) {
      return
    }
    const openRequests = this.#getOpenRequestIndices()
    for (const key of openRequests) {
      const request = this.#io.requests[key]
      if (!isAccumulation(request, this.#fs.pid)) {
        if (request.proctype === PROCTYPE.SERIAL) {
          const runnable = toRunnableRequest(request, key)
          return runnable
        }
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
    if (!isAccumulation(request, this.#fs.pid)) {
      this.#blankAccumulations()
    }
    return request
  }
  #blankAccumulations() {
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#fs.pid)) {
        assert(this.#io.replies[key], 'accumulation without reply')
        delete this.#io.requests[key]
        delete this.#io.replies[key]
      }
    }
  }
  getAccumulator(): Accumulator {
    const indices: number[] = []
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#fs.pid)) {
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
  #getOpenRequestIndices() {
    const keys = Object.keys(this.#io.requests).map((key) => parseInt(key))
    keys.sort((a, b) => a - b)
    return keys.filter((k) => !this.#io.replies[k])
  }
  get isExecuting() {
    // find a request that is serial and has no corresponding reply
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (!equal(request.target, this.#fs.pid)) {
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
    // but, need to consider pending slice

    return false
  }
  includes(poolable: Reply | SolidRequest) {
    assert(equal(poolable.target, this.#fs.pid), 'target mismatch')
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
  getOutcomeFor(request: PierceRequest) {
    for (const [key, value] of Object.entries(this.#io.requests)) {
      if (isPierceRequest(value)) {
        if (equal(value, request)) {
          return this.#io.replies[Number.parseInt(key)]
        }
      }
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
    const parentPid = this.#fs.pid
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
    const executing = this.getExecutingRequest()
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
    assert(equal(request.source, this.#fs.pid), 'only accumulations allowed')
    const sequence = this.#io.sequence++
    const sequenced: SolidRequest = { ...request, sequence }
    this.#io.requests[sequence] = sequenced
    return { sequence, sequenced }
  }
}

const check = (io: IoStruct) => {
  const requests = Object.values(io.requests)
  requests.every((request, index) =>
    requests.slice(index + 1).every((item) => !equal(item, request)) ||
    assert(false, 'duplicate request')
  )
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
const isAccumulation = (request: Request, thisPid: PID) => {
  if (isPierceRequest(request)) {
    return false
  }
  if (!equal(thisPid, request.target)) {
    assert(equal(thisPid, request.source), 'source must be equal to pid')
    return true
  } else {
    if (equal(thisPid, request.source)) {
      return true
    }
  }
  return false
}

const toRunnableRequest = (request: Request, sequence: number) => {
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
  const { sequence: _, ...unsequenced } = request
  return unsequenced
}
