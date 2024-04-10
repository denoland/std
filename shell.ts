import { transcribe } from '@/runners/runner-chat.ts'
import Compartment from './io/compartment.ts'
import {
  Artifact,
  DispatchFunctions,
  isPierceRequest,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
} from './constants.ts'
import { getProcType } from '@/constants.ts'
import { pidFromRepo } from '@/keys.ts'
import { assert, Debug, deserializeError, ulid } from '@utils'
import * as repo from '@/isolates/repo.ts'
import { Engine } from '@/engine.ts'
import { UnsequencedRequest } from '@/constants.ts'
import { PROCTYPE } from '@/constants.ts'
import { IoStruct } from '@/constants.ts'
const log = Debug('AI:cradle')

type PiercePromise = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

// Root device mounted successfully, but /sbin/init does not exist.
// Bailing out, you are on your own now. Good luck.

export class Shell implements Artifact {
  readonly #engine: Engine
  readonly #pid: PID
  private constructor(engine: Engine, pid: PID) {
    this.#engine = engine
    this.#pid = pid
    this.#watchPierces()
  }
  static create(engine: Engine, pid: PID) {
    // scope to a particular chainid
    return new Shell(engine, pid)
  }
  stop() {
    // start watching the chain you are subscribed to
    // possibly make a new session immediately ?
    return this.#engine.stop()
  }
  #pierces = new Map<string, PiercePromise>()
  #pierce(pierce: PierceRequest) {
    return new Promise((resolve, reject) => {
      this.#pierces.set(pierce.ulid, { resolve, reject })
      this.#engine.pierce({ pierce })
    })
  }
  #abort = new AbortController()
  async #watchPierces() {
    // there is only action that is alowed to be pierced in.
    // things might be simpler if pierce was stored separately from other
    // actions ?
    // if pierce is coming from only a single source, then easier to do sequence
    // coordination, like letting the client select the sequence, or the version
    // counter of the pierce array, or the client sending an ack up.
    const watchIo = this.#engine.read(this.#pid, '.io.json', this.#abort.signal)

    let patched = ''
    for await (const splice of watchIo) {
      console.log(splice.oid)
      if (!splice.changes) {
        continue
      }
      // TODO assert that the splice parent is the last splice
      let cursor = 0
      for (const diff of splice.changes) {
        if (diff.added) {
          patched = patched.substring(0, cursor) + diff.value +
            patched.substring(cursor)
          cursor += diff.value.length
        } else if (diff.removed) {
          const count = diff.count ?? 0
          patched = patched.substring(0, cursor) +
            patched.substring(cursor + count)
        } else {
          const count = diff.count ?? 0
          cursor += count
        }
      }
      const io = JSON.parse(patched)
      this.resolvePierces(io)
    }
  }
  // when we pierce, we need to wrap everything
  async actions<T>(isolate: string, target: PID) {
    // client side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params?: Params,
        options?: ProcessOptions,
      ) => {
        log('pierces %o', functionName)
        const proctype = getProcType(options)
        const request: UnsequencedRequest = {
          target,
          // ulid must be serverside, not browser side or core side
          isolate,
          functionName,
          params: params || {},
          // TODO pass the process options straight thru ?
          proctype,
        }
        const pierce: PierceRequest = {
          target: this.#pid,
          // ulid must be serverside, not browser side or core side
          ulid: ulid(),
          isolate: 'shell',
          functionName: 'pierce',
          params: { request },
          proctype: PROCTYPE.SERIAL,
        }
        return this.#pierce(pierce)
      }
    }
    log('pierces:', isolate, Object.keys(pierces))
    return pierces as T
  }

  //#section ARTIFACT API DIRECT CALLS
  async ping(params?: { data?: JsonValue }) {
    log('ping', params)
    await Promise.resolve()
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
    if (params?.data) {
      return params.data
    }
  }
  async apiSchema(params: { isolate: string }) {
    // can be edge
    const { isolate } = params
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  async transcribe(params: { audio: File }) {
    assert(params.audio instanceof File)
    const text = await transcribe(params.audio)
    return { text }
  }
  async probe(params: { repo?: string; pid?: PID }) {
    // pierce an action in using the repo isolate
    // this would be an action pierced in to the session chain ?
    // or would it be to the root chain ?
    // pierced into the session chain, relayed into the root chain
    // ? what is the pid of the root chain ? ulid, account / account
  }
  async init(params: { repo: string }) {
    // take in a string, and use the id that this client holds
    const pid = pidFromRepo(this.#pid.id, params.repo)
    // basically need to simply relay actions around the place
    const repoActions = await this.actions<repo.Api>('repo', this.#engine.pid)
    return repoActions.init({ pid })
  }
  async clone(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.id, params.repo)
    return { pid, head: 'head' }
  }
  async pull(params: { pid: PID }) {
    const { pid } = params
    return { pid, head: 'head' }
  }
  async push(params: { pid: PID }) {
  }
  async logs(params: { repo: string }) {
    // TODO convert logs to a splices query
    return []
  }
  async rm(params: { repo: string }) {
    log('rm', params.repo)
    // hit up the system chain to delete some stuff

    const repoActions = await this.actions<repo.Api>('repo', this.#engine.pid)
    const pid = pidFromRepo(this.#pid.id, params.repo)
    return repoActions.rm({ pid })
  }
  read(pid: PID, path?: string, signal?: AbortSignal) {
    return this.#engine.read(pid, path, signal)
  }
  resolvePierces(io: IoStruct) {
    for (const [, value] of Object.entries(io.requests)) {
      if (isPierceRequest(value)) {
        if (this.#pierces.has(value.ulid)) {
          const outcome = getOutcomeFor(io, value.ulid)
          if (outcome) {
            const promise = this.#pierces.get(value.ulid)
            this.#pierces.delete(value.ulid)
            assert(promise, 'Promise not found')
            if (outcome.error) {
              promise.reject(deserializeError(outcome.error))
            } else {
              promise.resolve(outcome.result)
            }
          }
        }
      }
    }
  }
}

export default Shell

const getOutcomeFor = (io: IoStruct, ulid: string) => {
  for (const [key, value] of Object.entries(io.requests)) {
    if (isPierceRequest(value)) {
      if (value.ulid === ulid) {
        return io.replies[key]
      }
    }
  }
}
