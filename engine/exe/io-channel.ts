/**
 * Manages the .io.json file
 */
import { actionSchema } from '@artifact/api/actions'
import equal from 'fast-deep-equal'
import { assert } from '@std/assert/assert'
import {
  isMergeReply,
  isPierceRequest,
  isRemoteRequest,
  MergeReply,
  PID,
  Proctype,
  RemoteRequest,
  Request,
  SolidReply,
  SolidRequest,
  UnsequencedRequest,
} from '@/constants.ts'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { IsolatePromise } from '@/constants.ts'
import { z } from 'zod'
import { outcomeSchema } from '../../api/actions.ts'

const createBase = () =>
  ioStruct.parse({
    sequence: 0,
    requests: {},
    executed: {},
    replies: {},
    parents: {},
    pendings: {},
    branches: {},
    state: {},
  })

export default class IOChannel {
  readonly #io: IoStruct
  readonly #fs: FS | undefined
  readonly #pid: PID
  #original: IoStruct
  private constructor(io: IoStruct, pid: PID, fs?: FS, noPurge?: boolean) {
    this.#pid = pid
    this.#io = io
    if (!noPurge) {
      this.#blankSettledRequests()
    }
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
  static load(fs: FS) {
    return IOChannel.#load(fs)
  }
  static loadWithoutPurge(fs: FS) {
    const noPurge = true
    return IOChannel.#load(fs, noPurge)
  }
  static async #load(fs: FS, noPurge?: boolean) {
    // TODO ensure this is cached
    let io = createBase()

    if (await fs.exists('.io.json')) {
      io = await fs.readJSON<IoStruct>('.io.json')
      check(io, fs.pid)
    }
    const channel = new IOChannel(io, fs.pid, fs, noPurge)
    return channel
  }
  static blank(fs: FS) {
    const io = new IOChannel(createBase(), fs.pid, fs)
    io.#save()
  }
  get state() {
    return this.#io.state
  }
  set state(value: IoStruct['state']) {
    this.#io.state = value
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
    const next = this.getRunnableExecution()
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
      if (rawRequest.proctype !== Proctype.enum.SERIAL) {
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
  getRunnableExecution() {
    const { request, sequence } = this.#getExecution()
    return toRunnableRequest(request, sequence)
  }
  getExecution() {
    const { request, sequence } = this.#getExecution()
    let commit = undefined
    const runnable = toRunnableRequest(request, sequence)
    if (isRemoteRequest(request)) {
      commit = request.commit
    }
    return { runnable, commit }
  }
  #getExecution() {
    if (this.#io.executing === undefined) {
      throw new Error('no execution action set')
    }
    const sequence = this.#io.executing
    assert(sequence in this.#io.requests, 'execution sequence not found')
    const request = this.#io.requests[sequence]
    return { request, sequence }
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
    assert(sequence in this.#io.requests, 'sequence not found: ' + sequence)

    return toRunnableRequest(this.#io.requests[sequence], sequence)
  }
  getOutcome(sequence: number) {
    assert(sequence in this.#io.replies, 'sequence not found')
    return this.#io.replies[sequence]
  }
  getOutcomeBySource(requestSource: PID, sequence: number) {
    for (const key in this.#io.requests) {
      const request = this.#io.requests[key]
      if (isRemoteRequest(request)) {
        if (
          equal(request.source, requestSource) && request.sequence === sequence
        ) {
          return this.#io.replies[Number.parseInt(key)]
        }
      }
    }
    throw new Error('sequence not found: ' + sequence)
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
    if (isMergeReply(reply)) {
      this.#io.parents[sequence] = reply.commit
    }
    const pendingsToBlank = []
    if (!this.#isAccumulation(request)) {
      const pendings = this.#io.pendings[sequence]
      if (pendings) {
        for (const layer of pendings) {
          for (const sequence of layer.sequences) {
            assert(this.isSettled(sequence), 'layer sequence not settled')
            pendingsToBlank.push(sequence)
          }
        }
      }
      delete this.#io.pendings[sequence]
      if (request.proctype !== Proctype.enum.DAEMON) {
        delete this.#io.branches[sequence]
      }
    }
    for (const key of pendingsToBlank) {
      const request = this.#io.requests[key]
      if (request.proctype !== Proctype.enum.DAEMON) {
        delete this.#io.branches[key]
      }
      delete this.#io.requests[key]
      delete this.#io.replies[key]
      delete this.#io.parents[key]
      delete this.#io.pendings[key]
      delete this.#io.executed[key]
    }
    if (this.#io.executing === sequence) {
      delete this.#io.executing
    }
    delete this.#io.executed[sequence]

    return request
  }
  getAccumulator(fs: FS): Accumulator {
    const indices: number[] = []
    const commits: string[] = []

    const origin = this.getRunnableExecution()
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
      const parent = this.#io.parents[index]
      const commit = commits.shift()
      const result: IsolatePromise = { request, outcome, commit, parent }
      accumulations.push(result)
    }
    return Accumulator.create(fs, accumulations)
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
    const isBranch = request.proctype === Proctype.enum.BRANCH ||
      request.proctype === Proctype.enum.DAEMON
    assert(isBranch, 'not a branch request')

    let branchName = sequence + ''
    if (request.branchName) {
      assert(!request.branchPrefix, 'cannot have both branch and branchPrefix')
      branchName = request.branchName
    }
    if (request.branchPrefix) {
      assert(!request.branch, 'cannot have both branch and branchPrefix')
      branchName = request.branchPrefix + '-' + sequence
    }
    const parentPid = this.#pid
    const branches = [...parentPid.branches, branchName]
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
    if (
      request.proctype === Proctype.enum.DAEMON ||
      request.proctype === Proctype.enum.BRANCH
    ) {
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
      delete this.#io.parents[key]
    }
  }
}

const parsedMap = new WeakMap()

const check = (io: IoStruct, thisPid: PID) => {
  // TODO move this to zod schema with refine
  // TODO check key sequences are sane
  // TODO do the same for reply values
  if (!parsedMap.has(io)) {
    // can use weakmap since at runtime, the object is typesafe, so can mutate
    ioStruct.parse(io)
    const isParsed = true
    parsedMap.set(io, isParsed)
  }

  for (const replyKey of Object.keys(io.replies)) {
    assert(replyKey in io.requests, 'no reply key in requests')
  }
  for (const request of Object.values(io.requests)) {
    if (!equal(request.target, thisPid)) {
      // TODO if move PID to be internal, then can cache better
      assert(!isPierceRequest(request), 'target pid mismatch - pierce')
      assert(equal(request.source, thisPid), 'target pid mismatch - acc')
    }
  }
}

const cache = new WeakMap<Request, Map<number, SolidRequest>>()
const toRunnableRequest = (request: Request, sequence: number) => {
  // TODO remove this function completely - translation is bad
  if (cache.has(request)) {
    const sequences = cache.get(request)
    if (sequences?.has(sequence)) {
      const request = sequences.get(sequence)
      assert(request, 'request not found: ' + sequence)
      return request
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

const sequenceInteger = z.number().int().gte(0)
const sequenceKey = z.string().refine((data) => {
  try {
    return sequenceInteger.safeParse(Number.parseInt(data)).success
  } catch (error) {
    return !error
  }
}, 'sequence key must be an integer')

export const ioStruct = z.object({
  sequence: sequenceInteger,
  /** The current sequence of the request being executed serially */
  executing: sequenceInteger.optional(),
  /** The sequences of requests that have been executed serially */
  executed: z.record(sequenceKey, z.boolean()),
  requests: z.record(sequenceKey, requestSchema),
  replies: z.record(sequenceKey, outcomeSchema),
  /** If a reply is a merge reply, the commit that carried it is stored here */
  parents: z.record(sequenceKey, md5),
  /**
   * If a request generates child requests, they are tracked here.  The commit
   * in each entry is the commit that caused the child requests to be generated.
   * This is used to replay by resetting the fs to that commit and doing a
   * replay.
   */
  pendings: z.record(
    sequenceKey,
    z.array(z.object({
      commit: md5,
      sequences: z.array(sequenceInteger),
    })),
  ),
  /** Active branches are stored here.  A branch is a daemon if it is listed
   * here but its request has been replied to or it is gone from the requests
   * list */
  branches: z.record(sequenceKey, z.string()),
  /**
   * Isolates can store values here and know they will not leak into other
   * branches, and will be quick to access since the io file is always loaded.
   */
  state: z.record(jsonSchema),
})
export type IoStruct = z.infer<typeof ioStruct>

// the accumulator should be a zod schema data structure, which is persisted.
// when filesystem ops occur, these are recovered at runtime during the replay,
// and not stored with these actions, which are meant for control, not for data
// transmission.
// BUT when replies come in and we want to merge, need to know what commit it
// was that it came in on

// split io to have an outbox, where all the replies coming in

// if pendings was a dedicated thing, then when the replies come back in, they
// can easily be assigned to the accumulator directly

// here's an action, and here's the response, also if you want it, here's the
// changed filesystem snapshot that came back.
// the app should treat the reply as tho it was a remote filesystem call

// what comes back should be a standard api call, that always returns the result
// as well as access to the filesystem of the returner.

// the accumulator is just a channel, and each comms with a remote thing should
// be one of these.  This might be the thing that gets merged in a comms branch.

const spawn = z.object({
  proctype: Proctype,
  /**
   * Allow a custom name for the new branch, if this is a branching request
   */
  branch: z.string().optional(),
  /**
   * If the custom branch name might not be unique, a prefix can be given and
   * the sequence number will be appended to the branch name, ensuring
   * uniqueness.
   */
  branchPrefix: z.string().optional(),
  /**
   * If the request is a branching request, this will be the name of the new
   * branch.  If the branch already exists, the request will fail.
   */
  branchName: z.string().optional(),
})
export type Invocation = z.infer<typeof invocation>
