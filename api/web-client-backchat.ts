// THIS IS SYNCED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  ActorApi,
  addBranches,
  ApiFunctions,
  backchatIdRegex,
  EngineInterface,
  IoStruct,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
  PROCTYPE,
  RpcOpts,
  SU_ACTOR,
  SU_BACKCHAT,
  toActions,
  UnsequencedRequest,
} from './web-client.types.ts'
import { ulid } from 'ulid'
import { PierceWatcher } from './web-client-watcher.ts'
import { Crypto } from '@/api/web-client-crypto.ts'
type Init = {
  repo: string
  isolate?: string
  params?: Params
}

export class Backchat {
  #init: Promise<void> | undefined

  readonly #engine: EngineInterface
  readonly #crypto: Crypto
  readonly #pid: PID
  readonly #abort = new AbortController()
  readonly #watcher: PierceWatcher

  private constructor(engine: EngineInterface, crypto: Crypto, pid: PID) {
    this.#engine = engine
    this.#crypto = crypto
    this.#pid = pid
    this.#watcher = PierceWatcher.create(this.#abort.signal, engine, pid)
    this.#watcher.watchPierces()

    engine.abortSignal.addEventListener('abort', () => {
      this.#abort.abort()
    })
  }
  /**
   * If the resume parameter is provided, the backchat will attempt to resume
   * the backchat session with the given id.  If the session is not found, a new
   * session will be created.
   * @param engine
   * @param key The Machine private key
   * @param resume the backchat id to attempt to resume
   */
  static async upsert(engine: EngineInterface, key: string, resume?: string) {
    if (resume && !backchatIdRegex.test(resume)) {
      throw new Error('Invalid resume backchat id: ' + resume)
    }
    const crypto = Crypto.load(key)
    const pid = await engine.upsertBackchat(crypto.machineId, resume)
    return new Backchat(engine, crypto, pid)
  }
  static superuser(engine: EngineInterface, crypto: Crypto) {
    const pid = addBranches(engine.homeAddress, SU_ACTOR, SU_BACKCHAT)
    return new Backchat(engine, crypto, pid)
  }
  get pid() {
    return this.#pid
  }
  get id() {
    return this.pid.branches[2]
  }
  get homeAddress() {
    return this.#engine.homeAddress
  }
  stop() {
    this.#abort.abort()
  }
  async engineStop() {
    this.stop()
    // TODO stopping the engine should stop all threads too
    await this.#engine.stop()
  }
  async actions<T = ApiFunctions>(isolate: string, opts: RpcOpts = {}) {
    const { target = this.#pid, ...procOpts } = opts
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.#action(request)
    return toActions<T>(target, isolate, schema, procOpts, execute)
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
  ping(params?: { data?: JsonValue }) {
    return this.#engine.ping(params?.data)
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
    // TODO move this to be rmRepo or something
    const actor = await this.#getActor()
    const { repo, all } = params
    return actor.rm({ repo, all })
  }
  async lsRepos() {
    const actor = await this.#getActor()
    return actor.lsRepos()
  }
  async #getActor() {
    const target = getActorPid(this.#pid)
    const actor = await this.actions<ActorApi>('actors', { target })
    return actor
  }
  read(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    if (after) {
      throw new Error('after not implemented')
    }
    return this.#engine.read(pid, path, after, signal)
  }
  readJSON<T>(path: string, pid: PID = this.pid, commit?: string) {
    return this.#engine.readJSON<T>(path, pid, commit)
  }
  exists(path: string, pid: PID = this.pid) {
    return this.#engine.exists(path, pid)
  }
  writeJSON(path: string, content?: JsonValue, pid: PID = this.pid) {
    return this.write(path, JSON.stringify(content), pid)
  }
  async write(path: string, content?: string, target: PID = this.pid) {
    const actions = await this.actions<Files>('files', { target })
    return actions.write({ path, content })
  }
  async delete(path: string, target: PID = this.pid): Promise<void> {
    const actions = await this.actions<Files>('files', { target })
    return actions.rm({ path })
  }
  async endSession(): Promise<void> {
    // should delete the session
  }
  async deleteAccountUnrecoverably(): Promise<void> {
    // throw new Error('not implemented')
  }
  async lsChildren() {
    const obj = await this.readJSON<IoStruct>('.io.json')
    return Object.values(obj.branches)
  }
}
type Files = {
  write: (
    params: { path: string; content?: string },
    opts?: ProcessOptions,
  ) => Promise<number>
  rm: (params: { path: string }) => Promise<void>
  ls: (params: { path: string; count: number }) => Promise<string[] | number>
  read: (params: { path: string }) => Promise<string>
  update: (params: Update) => Promise<number>
}

interface Update {
  path: string
  regex: string
  replacement: string
}

export const getActorPid = (source: PID) => {
  const branches = source.branches.slice(0, 2)
  return { ...source, branches }
}
