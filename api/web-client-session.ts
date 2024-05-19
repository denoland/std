// THIS IS SYNCED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  ArtifactMachine,
  ArtifactSession,
  assertValidSession,
  EngineInterface,
  freezePid,
  getActorPid,
  isValidForMachine,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  print,
  PROCTYPE,
  ROOT_SESSION,
  toActions,
  UnsequencedRequest,
} from './web-client.types.ts'
import { ulid } from 'ulid'
import { PierceWatcher } from './web-client-watcher.ts'
type Init = {
  repo: string
  isolate?: string
  params?: Params
}

export class Session implements ArtifactSession {
  #init: Promise<void> | undefined

  readonly #engine: EngineInterface
  readonly #machine: ArtifactMachine
  readonly #pid: PID
  readonly #abort = new AbortController()
  readonly #watcher: PierceWatcher

  readonly #dnsCache = new Map<string, PID>()

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

    engine.abortSignal.addEventListener('abort', () => {
      this.#abort.abort()
    })
  }
  static create(engine: EngineInterface, machine: ArtifactMachine) {
    const branches = [...machine.pid.branches, ulid()]
    const pid = { ...machine.pid, branches }
    return Session.resume(engine, machine, pid)
  }
  static resume(engine: EngineInterface, machine: ArtifactMachine, pid: PID) {
    freezePid(pid)
    if (!isValidForMachine(pid, machine.pid)) {
      // TODO change to be isChildOf
      throw new Error('Invalid session pid: ' + print(pid))
    }
    const terminal = new Session(engine, machine, pid)
    terminal.#init = machine.rootTerminalPromise.then(async (rootSession) => {
      await rootSession.#initialize(terminal.terminalId)
      terminal.#init = undefined
    })
    return terminal
  }
  static openRoot(engine: EngineInterface, machine: ArtifactMachine) {
    const branches = [...machine.pid.branches, ROOT_SESSION]
    const terminalPid = { ...machine.pid, branches }
    freezePid(terminalPid)
    return new Session(engine, machine, terminalPid)
  }
  async #initialize(terminalId: string) {
    const thisSessionId = this.pid.branches[this.pid.branches.length - 1]
    if (thisSessionId !== ROOT_SESSION) {
      throw new Error('only root session can initialize')
    }
    if (terminalId === ROOT_SESSION) {
      throw new Error('cannot initialize root session')
    }
    const terminalPid = createTerminalPid(this.pid, terminalId)
    if (await this.#engine.isTerminalAvailable(terminalPid)) {
      return
    }

    const request = {
      target: this.pid,
      isolate: 'actors',
      functionName: 'ensureTerminal',
      params: { terminalId },
      proctype: PROCTYPE.SERIAL,
    }
    return this.#action(request)
  }
  get pid() {
    return this.#pid
  }
  get machine() {
    return this.#machine
  }
  get terminalId() {
    return this.#pid.branches[this.#pid.branches.length - 1]
  }
  get homeAddress() {
    return this.#engine.homeAddress
  }
  get initializationPromise() {
    return Promise.resolve(this.#init)
  }
  stop() {
    this.#abort.abort()
  }
  async engineStop() {
    if (this.#init) {
      await this.#init
    }
    this.stop()
    // TODO stopping the engine should stop all sessions
    await this.#engine.stop()
  }
  newSession() {
    // TODO test rapidly creating two sessions, with queuing happening properly
    return Session.create(this.#engine, this.#machine)
  }
  resumeSession(pid: PID) {
    return Session.resume(this.#engine, this.#machine, pid)
  }
  async dns(repo: string) {
    const [account, repository, ...rest] = repo.split('/')
    if (rest.length || !account || !repository) {
      throw new Error('invalid repo: ' + repo)
    }
    const root = await this.#machine.rootTerminalPromise
    if (root.#dnsCache.has(repo)) {
      const pid = root.#dnsCache.get(repo)
      if (!pid) {
        throw new Error('repo not found: ' + repo)
      }
      freezePid(pid)
      return pid
    }

    const home = root.homeAddress
    type Superuser = { superuser: string }
    const { superuser } = await root.readJSON<Superuser>('config.json', home)

    const branches = home.branches.concat(superuser)
    const actor = { ...home, branches }

    type Repos = { [repo: string]: PID }
    const repos = await root.readJSON<Repos>('repos.json', actor)
    const pid = repos[repo]
    if (!pid) {
      throw new Error('repo not found: ' + repo)
    }
    root.#dnsCache.set(repo, pid)
    return pid
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
  async init({ repo, isolate, params }: Init) {
    const actor = await this.#getActor()
    return actor.init({ repo, isolate, params })
  }
  async clone({ repo, isolate, params }: Init) {
    const actor = await this.#getActor()
    return actor.clone({ repo, isolate, params })
  }
  pull(params: { pid: PID }) {
    const { pid } = params
    return Promise.resolve({ pid, head: 'head' })
  }
  push(_params: { pid: PID }) {
    console.log('push', _params)
    return Promise.resolve()
  }
  async rm(params: { repo?: string; all?: boolean }) {
    const actor = await this.#getActor()
    const { repo, all } = params
    return actor.rm({ repo, all })
  }
  async lsRepos() {
    const actor = await this.#getActor()
    return actor.lsRepos()
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
  clone: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string }>

  rm: (params: { repo?: string; all?: boolean }) => Promise<boolean>

  /**
   * List all the repos that this Actor has created.
   */
  lsRepos: () => Promise<string[]>
}
const createTerminalPid = (pid: PID, terminalId: string) => {
  const branches = [...pid.branches]
  branches[branches.length - 1] = terminalId
  return { ...pid, branches }
}
