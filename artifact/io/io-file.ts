/**
 * Manages the .io.json file
 */

import IsolateApi from '@/artifact/isolate-api.ts'
import {
  IoStruct,
  IsolatePromise,
  isPierceRequest,
  PID,
  Request,
} from '@/artifact/constants.ts'
import { Debug, equal } from '@utils'
import { IFs } from '@/artifact/constants.ts'
import { assert } from '@utils'
import { PROCTYPE } from '@/artifact/constants.ts'
import { Outcome } from '@/artifact/constants.ts'
const log = Debug('AI:io-file')

export default class IOFile {
  #pid: PID
  #api: IsolateApi
  #io: IoStruct
  constructor(pid: PID, api: IsolateApi, io: IoStruct) {
    this.#pid = pid
    this.#api = api
    this.#io = io
  }
  // TODO make commit required
  static async load(pid: PID, fs: IFs, commit?: string) {
    const api = IsolateApi.createFS(fs, commit)
    let io: IoStruct = { sequence: 0, requests: {}, replies: {} }
    if (await api.exists('.io.json')) {
      io = await api.readJSON('.io.json') as IoStruct
      check(io)
      blankSettledRequests(io, pid)
    }
    return new IOFile(pid, api, io)
  }
  save() {
    return this.#api.writeJSON('.io.json', this.#io)
  }
  isCallable(request: Request) {
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#pid)) {
        if (!this.#io.replies[key]) {
          return false
        }
      }
    }
    // TODO assert this is the first serial request to be called
    const sequence = this.getSequence(request)
    return this.#io.replies[sequence] === undefined
  }
  getSequence(request: Request) {
    for (const [key, value] of Object.entries(this.#io.requests)) {
      if (equal(value, request)) {
        return Number.parseInt(key)
      }
    }
    throw new Error('request not found')
  }
  addRequest(request: Request) {
    const sequence = this.#io.sequence++
    this.#io.requests[sequence] = request
  }
  addOutcome(sequence: number, outcome: Outcome) {
    assert(this.#io.requests[sequence], 'sequence not found')
    assert(!this.#io.replies[sequence], 'sequence already replied')
    this.#io.replies[sequence] = outcome
  }
  getAccumulator(): IsolatePromise[] {
    const indices: number[] = []
    for (const [key, request] of Object.entries(this.#io.requests)) {
      if (isAccumulation(request, this.#pid)) {
        indices.push(Number.parseInt(key))
      }
    }
    indices.sort((a, b) => a - b)
    return indices.map((key) => {
      const request = this.#io.requests[key]
      assert(!isPierceRequest(request), 'pierce request in accumulator')
      const outcome = this.#io.replies[key]
      return { request, outcome }
    })
  }
  print() {
    return JSON.stringify(this.#io, null, 2)
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
  // TODO blank accumulations when the origin is resolved
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
      assert(request.proctype !== PROCTYPE.SERIAL, 'no serial accumulation')
      return true
    }
  }
  return false
}
