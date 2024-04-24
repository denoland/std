// THIS IS SYCNED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  ArtifactSession,
  EngineInterface,
  freezePid,
  IoStruct,
  isPierceRequest,
  JsonValue,
  PID,
  pidFromRepo,
  PierceRequest,
  print,
  PROCTYPE,
  toActions,
  UnsequencedRequest,
} from './web-client.types.ts'
import { ulid } from 'ulid'
import { deserializeError } from 'serialize-error'
import { Home } from './web-client-home.ts'

type PiercePromise = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export class Session implements ArtifactSession {
  readonly #engine: EngineInterface
  readonly #pid: PID
  readonly #home: Home

  readonly #pierces = new Map<string, PiercePromise>()
  readonly #abort = new AbortController()
  #repo: Promise<Repo> | undefined
  private constructor(engine: EngineInterface, pid: PID, home: Home) {
    this.#engine = engine
    this.#pid = pid
    this.#home = home
    this.#watchPierces()
  }
  static create(engine: EngineInterface, pid: PID, home: Home) {
    freezePid(pid)
    if (pid.branches.length !== 2) {
      const branches = print(pid)
      throw new Error('Session chain not direct child of base: ' + branches)
    }
    return new Session(engine, pid, home)
  }
  static createHome(engine: EngineInterface, pid: PID, home: Home) {
    freezePid(pid)
    if (pid.branches.length !== 1) {
      const branches = print(pid)
      throw new Error('Home session must be base: ' + branches)
    }
    return new Session(engine, pid, home)
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
  createSession(retry?: PID): Promise<ArtifactSession> {
    return this.#home.createSession(retry)
  }
  async #watchPierces() {
    let lastSplice
    const { signal } = this.#abort
    const after = undefined
    const splices = this.#engine.read(this.#pid, '.io.json', after, signal)
    for await (const splice of splices) {
      // move these checks to the engine side
      if (lastSplice && splice.commit.parent[0] !== lastSplice.oid) {
        console.dir(splice, { depth: Infinity })
        console.dir(lastSplice, { depth: Infinity })
        throw new Error('parent mismatch: ' + splice.oid)
      }
      lastSplice = splice

      if (splice.changes['.io.json']) {
        const { patch } = splice.changes['.io.json']
        // TODO move to unified diff patches
        if (!patch) {
          throw new Error('io.json patch not found')
        }
        const io = JSON.parse(patch)
        this.#resolvePierces(io)
      }
    }
  }
  async actions<T>(isolate: string, targetPID: PID) {
    const target = targetPID ? targetPID : this.pid
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.#action(request)
    return toActions<T>(target, isolate, schema, execute)
  }
  #action(request: UnsequencedRequest) {
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
  read(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    if (after) {
      throw new Error('after not implemented')
    }
    return this.#engine.read(pid, path, after, signal)
  }
  async endSession(): Promise<void> {
  }
  async deleteAccountUnrecoverably(): Promise<void> {
    // throw new Error('not implemented')
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
