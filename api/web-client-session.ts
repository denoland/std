// THIS IS SYNCED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  ArtifactMachine,
  ArtifactSession,
  assertValidSession,
  EngineInterface,
  freezePid,
  getActorPid,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  PROCTYPE,
  toActions,
  UnsequencedRequest,
} from './web-client.types.ts'
import { ulid } from 'ulid'
import { PierceWatcher } from './web-client-watcher.ts'

export class Session implements ArtifactSession {
  #init: Promise<unknown> | undefined

  readonly #engine: EngineInterface
  readonly #machine: ArtifactMachine
  readonly #pid: PID
  readonly #abort = new AbortController()
  readonly #watcher: PierceWatcher

  private constructor(
    engine: EngineInterface,
    machine: ArtifactMachine,
    pid: PID,
  ) {
    assertValidSession(pid, engine.homeAddress)
    this.#engine = engine
    this.#machine = machine
    this.#pid = pid
    this.#watcher = PierceWatcher.create(this.#abort.signal, engine, pid)
    this.#watcher.watchPierces()
  }
  static create(engine: EngineInterface, machine: ArtifactMachine, pid: PID) {
    freezePid(pid)
    const session = new Session(engine, machine, pid)
    session.#init = machine.rootSessionPromise.then(async (rootSession) => {
      await rootSession.#initialize(session.sessionId)
      session.#init = undefined
    })
    return session
  }
  static resume(engine: EngineInterface, machine: ArtifactMachine, pid: PID) {
    // TODO check this is still a valid pid using ping or similar
    freezePid(pid)
    return new Session(engine, machine, pid)
  }
  get pid() {
    return this.#pid
  }
  get sessionId() {
    return this.#pid.branches[this.#pid.branches.length - 1]
  }
  get homeAddress() {
    return this.#engine.homeAddress
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
  stop() {
    this.#abort.abort()
  }
  async engineStop() {
    if (this.#init) {
      await this.#init
    }
    this.stop()
    await this.#engine.stop()
  }
  newSession() {
    // TODO test rapidly creating two sessions, with queuing happening properly
    return this.#machine.openSession()
  }
  resumeSession(pid: PID) {
    return this.#machine.openSession(pid)
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
    const promise = this.#watcher.watch(pierce.ulid)
    // TODO handle an error in pierce
    if (this.#init) {
      this.#init = this.#init.then(() => this.#engine.pierce(pierce))
    } else {
      this.#engine.pierce(pierce)
    }
    return promise
  }

  async ping(params?: { data?: JsonValue }) {
    if (this.#init) {
      await this.#init
    }
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
  async init(
    { repo, isolate, params }: {
      repo: string
      isolate?: string
      params?: Params
    },
  ) {
    const actor = await this.#getActor()
    return actor.init({ repo, isolate, params })
  }
  async clone({ repo }: { repo: string }) {
    const actor = await this.#getActor()
    return actor.clone({ repo })
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
    const actor = await this.#getActor()
    return actor.rm({ repo: params.repo })
  }
  async #getActor() {
    const actorPid = getActorPid(this.#pid)
    const actor = await this.actions<ActorApi>('actors', actorPid)
    return actor
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
    // should delete the session
  }
  async deleteAccountUnrecoverably(): Promise<void> {
    // throw new Error('not implemented')
  }
}

type ActorApi = { // copied from the isolate
  init: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string }>
  /** Clones from github, using the github PAT (if any) for the calling machine.
   * Updates the repo.json file in the actor branch to point to the new PID of
   * the clone.
   */
  clone: (params: { repo: string }) => Promise<{ pid: PID; head: string }>

  rm: (params: { repo: string }) => Promise<boolean>

  /**
   * List all the repos that this Actor has created.
   */
  lsRepos: () => Promise<string[]>
}
