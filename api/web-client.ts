// THIS IS SYCNED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  Artifact,
  DispatchFunctions,
  EngineInterface,
  freezePid,
  getProcType,
  IoStruct,
  isPierceRequest,
  JsonValue,
  Params,
  PID,
  pidFromRepo,
  PierceRequest,
  ProcessOptions,
  PROCTYPE,
  UnsequencedRequest,
} from './web-client.types.ts'
import { ulid } from 'ulid'
import { deserializeError } from 'serialize-error'

type PiercePromise = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export class Shell implements Artifact {
  readonly #engine: EngineInterface
  readonly #pid: PID
  readonly #pierces = new Map<string, PiercePromise>()
  readonly #abort = new AbortController()
  #repo: Promise<Repo> | undefined
  private constructor(engine: EngineInterface, pid: PID) {
    this.#engine = engine
    this.#pid = pid
    this.#watchPierces()
  }
  static create(engine: EngineInterface, pid: PID) {
    freezePid(pid)
    return new Shell(engine, pid)
  }
  get pid() {
    return this.#pid
  }
  async #repoActions() {
    if (!this.#repo) {
      this.#repo = this.actions<Repo>('repo', this.#pid)
    }
    return await this.#repo
  }
  stop() {
    this.#abort.abort()
    return this.#engine.stop()
  }
  async #watchPierces() {
    const watchIo = this.#engine.read(this.#pid, '.io.json', this.#abort.signal)

    let patched = ''
    let lastSplice
    const reader = watchIo.getReader()
    while (watchIo.locked) {
      const { value: splice, done } = await reader.read()
      if (done) {
        console.error('splice stream ended')
        break
      }
      if (lastSplice && splice.commit.parent[0] !== lastSplice.oid) {
        throw new Error('parent mismatch: ' + splice.oid)
      }
      lastSplice = splice
      if (!splice.changes) {
        continue
      }
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
      this.#resolvePierces(io)
    }
  }
  async actions<T>(isolate: string, target: PID) {
    // client side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      actions[functionName] = (params?: Params, options?: ProcessOptions) => {
        const proctype = getProcType(options)
        const request: UnsequencedRequest = {
          target,
          isolate,
          functionName,
          params: params || {},
          proctype,
        }
        const pierce: PierceRequest = {
          target: this.#pid,
          ulid: ulid(),
          isolate: 'shell',
          functionName: 'pierce',
          params: { request },
          proctype: PROCTYPE.SERIAL,
        }
        return new Promise((resolve, reject) => {
          this.#pierces.set(pierce.ulid, { resolve, reject })
          this.#engine.pierce(pierce)
        })
      }
    }
    return actions as T
  }

  ping(params?: { data?: JsonValue }) {
    return this.#engine.ping(params?.data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
  apiSchema(isolate: string) {
    return this.#engine.apiSchema(isolate)
  }
  async transcribe(params: { audio: File }) {
    // TODO check account standing to use this feature
    if (!(params.audio instanceof File)) {
      throw new Error('audio must be a File')
    }
    return await this.#engine.transcribe(params.audio)
  }
  async probe({ pid }: { pid: PID }) {
    const actions = await this.#repoActions()
    return actions.probe({ pid })
  }
  async init(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.id, params.repo)
    const actions = await this.#repoActions()
    return actions.init({ pid })
  }
  async clone(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.id, params.repo)
    const actions = await this.#repoActions()
    return actions.clone({ pid })
  }
  pull(params: { pid: PID }) {
    const { pid } = params
    return Promise.resolve({ pid, head: 'head' })
  }
  push(_params: { pid: PID }) {
    console.log('push', _params)
    return Promise.resolve()
  }
  async rm(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.id, params.repo)
    const actions = await this.#repoActions()
    return actions.rm({ pid })
  }
  read(pid: PID, path?: string, signal?: AbortSignal) {
    return this.#engine.read(pid, path, signal)
  }
  #resolvePierces(io: IoStruct) {
    for (const [, value] of Object.entries(io.requests)) {
      if (isPierceRequest(value)) {
        if (this.#pierces.has(value.ulid)) {
          const outcome = getOutcomeFor(io, value.ulid)
          if (outcome) {
            const promise = this.#pierces.get(value.ulid)
            this.#pierces.delete(value.ulid)
            if (!promise) {
              throw new Error('Promise not found')
            }
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

const getOutcomeFor = (io: IoStruct, ulid: string) => {
  for (const [key, value] of Object.entries(io.requests)) {
    if (isPierceRequest(value)) {
      if (value.ulid === ulid) {
        return io.replies[key]
      }
    }
  }
}
type Repo = {
  probe: (params: { pid: PID }) => Promise<{ pid: PID; head: string }>
  init: (params: { pid: PID }) => Promise<{ pid: PID; head: string }>
  clone: (
    params: { pid: PID },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
  rm: (params: { pid: PID }) => Promise<boolean>
}
