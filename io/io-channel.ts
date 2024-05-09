/**
 * Manages the .io.json file
 */

import { assert, equal } from '@utils'
import {
  IoStruct,
  isPierceRequest,
  isRemoteRequest,
  MergeReply,
  PID,
  PROCTYPE,
  RemoteRequest,
  Request,
  SolidReply,
  SolidRequest,
  UnsequencedRequest,
} from '@/constants.ts'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { IsolatePromise } from '@/constants.ts'

const createBase = (): IoStruct => ({
  sequence: 0,
  requests: {},
  executed: {},
  replies: {},
  pendings: {},
  branches: {},
})

export default class IOChannel {
  readonly #io: IoStruct
  readonly #fs: FS | undefined
  readonly #pid: PID
  #original: IoStruct
  private constructor(io: IoStruct, pid: PID, fs?: FS) {
    this.#pid = pid
    this.#io = io
    this.#blankSettledRequests()
    if (fs) {
      // TODO remove the fs item completely - handle fs outside
      assert(equal(pid, fs.pid), 'pid mismatch')
    }
    this.#fs = fs
    // TODO use immer or similar to avoid this parsing step
    this.#original = structuredClone(this.#io)
  }
  static readObject(io: IoStruct, pid: PID) {
    check(io, pid)
    return new IOChannel(io, pid)
  }
  static async read(fs: FS) {
    if (await fs.exists('.io.json')) {
      const io = await fs.readJSON<IoStruct>('.io.json')
      check(io, fs.pid)
      return new IOChannel(io, fs.pid)
    }
  }
  static async load(fs: FS) {
    // TODO ensure this is cached
    let io = createBase()

    if (await fs.exists('.io.json')) {
      io = await fs.readJSON('.io.json') as IoStruct
      check(io, fs.pid)
    }
    const channel = new IOChannel(io, fs.pid, fs)
    return channel
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
    // TODO make save a one shot thing
    this.#original = structuredClone(this.#io)
    return this.#save()
  }
  isExecution(attempt: SolidRequest) {
    const next = this.getExecution()
    return equal(next, attempt)
  }
  isExecutionAvailable() {
    if (this.#io.executing !== undefined) {
      return false
    }
    return !!this.#nextExecution()
  }
  #nextExecution() {
    if (this.#io.executing !== undefined) {
      throw new Error('execution already set')
    }
    const unreplied = Object.keys(this.#io.requests)
      .map((key) => parseInt(key))
      .filter((k) => !this.#io.replies[k])
      .filter((sequence) => !this.#io.executed[sequence])
      .sort((a, b) => a - b)

    for (const sequence of unreplied) {
      const rawRequest = this.#io.requests[sequence]
      if (rawRequest.proctype !== PROCTYPE.SERIAL) {
        continue
      }
      if (!equal(rawRequest.target, this.#pid)) {
        continue
      }
      if (!this.#io.pendings[sequence]) {
        const request = toRunnableRequest(rawRequest, sequence)
        return { request, sequence }
      }
      const pendings = this.#io.pendings[sequence]
      const lastLayer = pendings[pendings.length - 1]
      if (lastLayer.sequences.every((sequence) => this.isSettled(sequence))) {
        const request = toRunnableRequest(rawRequest, sequence)
        return { request, sequence }
      }
    }
  }
  setExecution() {
    const next = this.#nextExecution()
    if (!next || !next.request || next.sequence === undefined) {
      throw new Error('no execution action available')
    }
    const { request, sequence } = next
    this.#io.executing = sequence
    this.#io.executed[sequence] = true
    return { request, sequence }
  }
  getExecution() {
    if (this.#io.executing === undefined) {
      throw new Error('no execution action set')
    }
    const sequence = this.#io.executing
    assert(sequence in this.#io.requests, 'execution sequence not found')
    const request = this.#io.requests[sequence]
    return toRunnableRequest(request, sequence)
  }
  getSequence(request: SolidRequest) {
    for (const [key, value] of Object.entries(this.#io.requests)) {
      // TODO is it possible to have duplicate entries here ?
      // ideally this function would never get called
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
  reply(reply: MergeReply | SolidReply) {
    const { sequence } = reply
    assert(Number.isInteger(sequence), 'reply needs a sequence number')
    assert(sequence >= 0, 'reply needs a whole sequence number')
    assert(!this.isSettled(sequence), 'sequence already settled: ' + sequence)

    const request = this.#io.requests[sequence]
    assert(request, `reply sequence not found: ${sequence}`)
    assert(!this.#io.replies[sequence], 'sequence already replied')
    this.#io.replies[sequence] = reply.outcome
    const blanks = []
    if (!this.#isAccumulation(request)) {
      const pendings = this.#io.pendings[sequence]
      if (pendings) {
        for (const layer of pendings) {
          for (const sequence of layer.sequences) {
            assert(this.isSettled(sequence), 'layer sequence not settled')
            blanks.push(sequence)
          }
        }
      }
    }
    for (const key of blanks) {
      const request = this.#io.requests[key]
      if (request.proctype !== PROCTYPE.DAEMON) {
        delete this.#io.branches[key]
      }
      delete this.#io.requests[key]
      delete this.#io.replies[key]
      delete this.#io.pendings[key]
      delete this.#io.executed[key]
    }
    if (this.#io.executing === sequence) {
      delete this.#io.executing
    }

    return request
  }
  getAccumulator(fs: FS): Accumulator {
    const indices: number[] = []
    const commits: string[] = []

    const origin = this.getExecution()
    assert(origin, 'no serial request found')
    const sequence = this.getSequence(origin)
    const pendings = this.#io.pendings[sequence]
    if (pendings) {
      for (const layer of pendings) {
        for (const sequence of layer.sequences) {
          assert(this.isSettled(sequence), 'layer sequence not settled')
          indices.push(sequence)
          commits.push(layer.commit)
        }
      }
    }
    const accumulations: IsolatePromise[] = []
    for (const index of indices) {
      const saved = this.#io.requests[index]
      assert(!isPierceRequest(saved), 'pierce request cannot accumulate')
      const request = toUnsequenced(saved)
      const outcome = this.#io.replies[index]
      const commit = commits.shift()
      const result: IsolatePromise = { request, outcome, commit }
      accumulations.push(result)
    }
    return Accumulator.create(origin, accumulations, fs)
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
    if (request.branchName) {
      assert(!request.branchPrefix, 'cannot have both branch and branchPrefix')
      name = request.branchName
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
  addPending(sequence: number, commit: string, requests: UnsequencedRequest[]) {
    assert(!this.isSettled(sequence), 'sequence already settled')
    assert(!this.isPendingIncluded(sequence, commit), 'commit already included')
    assert(this.#io.executing === sequence, 'sequence not executing')

    const sequences = []
    const solidified: (SolidRequest | RemoteRequest)[] = []
    for (const request of requests) {
      const { sequence, sequenced } = this.#addUnsequenced(request)
      sequences.push(sequence)
      solidified.push(sequenced)
    }
    if (!this.#io.pendings[sequence]) {
      this.#io.pendings[sequence] = []
    }
    const pendings = this.#io.pendings[sequence]
    if (pendings.length) {
      const lastLayer = pendings[pendings.length - 1]
      const allSettled = lastLayer.sequences
        .every((sequence) => this.isSettled(sequence))
      assert(allSettled, 'all sequences must be settled')
    }

    pendings.push({ commit, sequences })
    delete this.#io.executed[sequence]
    delete this.#io.executing
    return solidified
  }
  #addUnsequenced(request: UnsequencedRequest) {
    const sequence = this.#io.sequence++
    const source = this.#pid
    const sequenced: SolidRequest = { ...request, sequence, source }
    this.#addRequest(sequenced, sequence)
    return { sequence, sequenced }
  }
  addRequest(request: Request) {
    const sequence = this.#io.sequence++
    this.#addRequest(request, sequence)
    return sequence
  }
  #addRequest(request: Request, sequence: number) {
    this.#io.requests[sequence] = request
    const { proctype } = request
    if (proctype === PROCTYPE.DAEMON || proctype === PROCTYPE.BRANCH) {
      if (equal(request.target, this.#pid)) {
        const pid = this.getBranchPid(sequence)
        this.#io.branches[sequence] = pid.branches[pid.branches.length - 1]
      }
    }
  }
  /** An accumulation is an action sourced from this branch */
  #isAccumulation(request: Request) {
    if (isPierceRequest(request)) {
      return false
    }
    if (equal(this.#pid, request.source)) {
      return true
    }
    return false
  }
  #blankSettledRequests() {
    const toBlank = []
    for (const key in this.#io.replies) {
      if (!this.#isAccumulation(this.#io.requests[key])) {
        toBlank.push(parseInt(key))
      }
    }
    for (const key of toBlank) {
      delete this.#io.requests[key]
      delete this.#io.replies[key]
      delete this.#io.pendings[key]
      delete this.#io.executed[key]
    }
  }
}

const check = (io: IoStruct, pid: PID) => {
  // TODO check format
  // TODO check key sequences are sane
  // TODO do the same for reply values
  for (const replyKey of Object.keys(io.replies)) {
    assert(replyKey in io.requests, 'no reply key in requests')
  }
  for (const request of Object.values(io.requests)) {
    if (!equal(request.target, pid)) {
      assert(!isPierceRequest(request), 'target pid mismatch')
      assert(equal(request.source, pid), 'target pid mismatch')
    }
  }
}

const cache = new WeakMap<Request, Map<number, SolidRequest>>()
const toRunnableRequest = (request: Request, sequence: number) => {
  // TODO remove this function completely - translation is bad
  if (cache.has(request)) {
    const sequences = cache.get(request)
    if (sequences?.has(sequence)) {
      return sequences.get(sequence)
    }
  }
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
  if (!cache.has(request)) {
    cache.set(request, new Map())
  }
  cache.get(request)?.set(sequence, internal)
  return internal
}
export const toUnsequenced = (
  request: SolidRequest | RemoteRequest,
): UnsequencedRequest => {
  if (isRemoteRequest(request)) {
    const { sequence: _, source: __, commit: ___, ...unsequenced } = request
    return unsequenced
  }
  const { sequence: _, source: __, ...unsequenced } = request
  return unsequenced
}
