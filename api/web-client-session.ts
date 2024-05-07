// THIS IS SYCNED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  ArtifactSession,
  assertValidSession,
  EngineInterface,
  freezePid,
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
import { PierceWatcher } from './web-client-watcher.ts'

export class Session implements ArtifactSession {
  #init: Promise<void> | undefined
  #repo: Promise<Repo> | undefined

  readonly #engine: EngineInterface
  readonly #pid: PID
  readonly #abort = new AbortController()
  readonly #watcher: PierceWatcher

  private constructor(
    engine: EngineInterface,
    pid: PID,
    initializing?: Promise<Session>,
  ) {
    assertValidSession(pid, engine.homeAddress)
    this.#engine = engine
    this.#pid = pid
    this.#watcher = PierceWatcher.create(this.#abort.signal, engine, pid)
    if (initializing) {
      this.#init = initializing.then(async (system) => {
        await system.#initialize(this.sessionId)
        this.#watcher.watchPierces()
        this.#init = undefined
      })
    } else {
      this.#watcher.watchPierces()
    }
  }
  static create(engine: EngineInterface, pid: PID, system: Promise<Session>) {
    freezePid(pid)
    return new Session(engine, pid, system)
  }
  static resume(engine: EngineInterface, pid: PID) {
    // TODO check this is still a valid pid using ping or similar
    freezePid(pid)
    return new Session(engine, pid)
  }
  static createSystem(engine: EngineInterface, pid: PID) {
    freezePid(pid)
    return new Session(engine, pid)
  }
  get pid() {
    return this.#pid
  }
  get sessionId() {
    return this.#pid.branches[this.#pid.branches.length - 1]
  }
  #initialize(sessionId: string) {
    // we are the system session, and we are being asked to make a new session
    const request = {
      target: this.pid,
      isolate: 'actors',
      functionName: 'createSession',
      params: { sessionId },
      proctype: PROCTYPE.SERIAL,
    }
    return this.#action(request)
  }
  async #repoActions() {
    // TODO this is really a scopeTo call on the base session object
    if (!this.#repo) {
      this.#repo = this.actions<Repo>('repo', this.#pid)
    }
    return await this.#repo
  }
  stop(): Promise<void> | void {
    this.#abort.abort()
  }

  async actions<T>(isolate: string, target: PID = this.pid) {
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
      this.#watcher.watch(pierce.ulid, { resolve, reject })
      // TODO handle an error in pierce
      if (this.#init) {
        this.#init = this.#init.then(() => this.#engine.pierce(pierce))
      } else {
        this.#engine.pierce(pierce)
      }
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
    // TODO make this be pure read, rather than a commitable action
    const actions = await this.#repoActions()
    return actions.probe({ pid })
  }
  async init(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.repoId, params.repo)
    const actions = await this.#repoActions()
    return actions.init({ pid })
  }
  async clone(params: { repo: string }) {
    const pid = pidFromRepo(this.#pid.repoId, params.repo)
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
    const pid = pidFromRepo(this.#pid.repoId, params.repo)
    const actions = await this.#repoActions()
    return actions.rm({ pid })
  }
  read(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    if (after) {
      throw new Error('after not implemented')
    }
    return this.#engine.read(pid, path, after, signal)
  }
  readJSON<T>(path: string, pid: PID = this.pid) {
    return this.#engine.readJSON<T>(path, pid)
  }
  exists(path: string, pid: PID = this.pid) {
    return this.#engine.exists(path, pid)
  }
  async endSession(): Promise<void> {
  }
  async deleteAccountUnrecoverably(): Promise<void> {
    // throw new Error('not implemented')
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
