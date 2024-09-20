// THIS IS SYNCED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  addBranches,
  backchatIdRegex,
  backchatStateSchema,
  EngineInterface,
  getParent,
  getThreadPath,
  IoStruct,
  JsonValue,
  Params,
  PID,
  Pierce,
  Proctype,
  RpcOpts,
  SU_ACTOR,
  SU_BACKCHAT,
  threadSchema,
  toActions,
  UnsequencedRequest,
} from './types.ts'
import * as actor from './isolates/actor.ts'
import * as files from './isolates/files.ts'
import { ulid } from 'ulid'
import { PierceWatcher } from './watcher.ts'
import { Crypto } from './crypto.ts'
import { ZodObject, ZodTypeAny } from 'zod'
import z from 'zod'
type Init = {
  repo: string
  isolate?: string
  params?: Params
}

export class Backchat {
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
   * the backchat branch with the given id.  If the branch is not found, a new
   * branch will be created with a new id.
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
    const id = this.pid.branches[2]
    if (!backchatIdRegex.test(id)) {
      throw new Error('Invalid backchat id: ' + id)
    }
    return id
  }
  get machineId() {
    return this.#crypto.machineId
  }
  get homeAddress() {
    return this.#engine.homeAddress
  }
  async readBaseThread() {
    const io = await this.readJSON<IoStruct>('.io.json')
    const state = backchatStateSchema.parse(io.state)
    return state.target
  }

  /**
   * This is the main function that is used to interact with the backchat
   * system. The prompt is relayed thru a switchboard agent to select what is
   * the best agent to process this message, which will be loaded and asked to
   * process this message.
   * @param content The optional text that is to be parsed by the AI.  It can be
   * empty if there are files attached or to indicate a positive response to
   * something.
   * @param attachments The relative paths to the files that were attached with
   * the  prompt, which may include directories.  May include pointers to the
   * tmp files that are created when a user attaches files in the browser.  Can
   * also include structured data that widgets have prepared.
   */
  // TODO adorn with other types of input, like file paths and selections
  prompt(content: string, target?: PID, attachments?: string[]) {
    const params: Params = { content }
    if (attachments) {
      params.attachments = attachments
    }
    if (target) {
      params.target = target
    }
    return this.#backchatAction('prompt', params)
  }
  newThread() {
    return this.#backchatAction('newThread', {})
  }
  changeRemote(remote?: PID) {
    const params: Params = {}
    if (remote) {
      params.remote = remote
    }
    return this.#backchatAction('changeRemote', params)
  }

  async actions<T>(isolate: string, opts: RpcOpts = {}) {
    const { target = this.#pid, ...procOpts } = opts
    const schema = await this.apiSchema(isolate)
    const execute = (request: UnsequencedRequest) => this.#action(request)
    return toActions<T>(target, isolate, schema, procOpts, execute)
  }
  #action(request: UnsequencedRequest) {
    // TODO if the target is this branch, convert to a direct pierce
    return this.#backchatAction('relay', { request })
  }
  async #backchatAction(functionName: string, params: Params) {
    const pierce: Pierce = {
      target: this.#pid,
      ulid: ulid(),
      isolate: 'backchat',
      functionName,
      params,
      proctype: Proctype.enum.SERIAL,
    }
    const promise = this.#watcher.watch(pierce.ulid)
    // TODO handle an error in pierce
    await this.#engine.pierce(pierce)
    return await promise
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
  /**
   * Initialize a new repository, optionally installing an isolate with the
   * given parameters.
   */
  async init({ repo, isolate, params }: Init) {
    const actor = await this.#getActor()
    return actor.init({ repo, isolate, params })
  }
  /** Clone the given repo from github, optionally installing an isolate with
   * the given parameters
   */
  async clone({ repo, isolate, params }: Init) {
    const actor = await this.#getActor()
    return actor.clone({ repo, isolate, params })
  }
  async pull(params: { repo: string; target: PID }) {
    const { repo, target = this.pid } = params
    const actor = await this.#getActor()
    return actor.pull({ repo, target })
  }
  push(params: { pid: PID }) {
    return Promise.resolve(params)
  }
  async rm(params: { repo?: string; all?: boolean }) {
    // TODO move this to be rmRepo or something
    const actor = await this.#getActor()
    const { repo, all } = params
    return actor.rm({ repo, all })
  }
  async lsRepos() {
    const actor = await this.#getActor()
    return actor.lsRepos({})
  }
  async #getActor() {
    const target = getParent(this.#pid)
    const actor = await this.actions<actor.Api>('actor', { target })
    return actor
  }
  watch(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    if (after) {
      throw new Error('after not implemented')
    }
    return this.#engine.watch(pid, path, after, signal)
  }
  read(path: string, pid: PID = this.pid, commit?: string) {
    return this.#engine.read(path, pid, commit)
  }
  readJSON<T>(path: string, pid: PID = this.pid, commit?: string) {
    return this.#engine.readJSON<T>(path, pid, commit)
  }
  async readThread(pid?: PID) {
    if (!pid) {
      pid = await this.readBaseThread()
    }
    const thread = await this.readJSON(getThreadPath(pid), pid)
    return threadSchema.parse(thread)
  }
  readTree(path: string, target: PID = this.pid, commit?: string) {
    // TODO use the web cache for these calls, both in engine and clients
    return this.#engine.readTree(path, target, commit)
  }
  readMeta(path: string, target: PID = this.pid, commit?: string) {
    // this should read the commit for the file
    // if commit is given, then it will find the commit PRIOR to the given one
    // where he requested file changed
    // TODO make this follow renames
    // TODO ensure that the order of the tree helps with knowing what changed
    // this might be a read splice, where the filepath is provided
    console.log('readMeta', path, target, commit)
  }
  /** For a given target PID, read in the latest splice, or optionally the
   * splice at the given commit.  If path is given, then the splice will be the
   * splice where that file changed BEFORE the target splice, which can be
   * either provided, or the latest splice.  To walk changes in a file, keep
   * calling this method with the commit set to the parent of each returned
   * splice.  If no such splice exists, the origin splice will be returned,
   * which has no parents */
  splice(
    target: PID,
    opts: { commit?: string; path?: string; count?: number } = {},
  ) {
    return this.#engine.splice(target, opts)
  }
  async state<T extends ZodObject<Record<string, ZodTypeAny>>>(
    pid: PID,
    schema: T,
  ) {
    const io = await this.readJSON<IoStruct>('.io.json', pid)
    return schema.parse(io.state) as z.infer<T>
  }
  exists(path: string, pid: PID = this.pid) {
    return this.#engine.exists(path, pid)
  }
  writeJSON(path: string, content?: JsonValue, pid: PID = this.pid) {
    return this.write(path, JSON.stringify(content), pid)
  }
  async write(path: string, content?: string, target: PID = this.pid) {
    const actions = await this.actions<files.Api>('files', { target })
    return actions.write({ reasoning: [], path, content })
  }
  async delete(path: string, target: PID = this.pid): Promise<void> {
    const actions = await this.actions<files.Api>('files', { target })
    return actions.rm({ reasoning: [], path })
  }
  async ls({ path = '.', target = this.pid }: { path?: string; target?: PID }) {
    const tree = await this.readTree(path, target)
    return tree.map((entry) => entry.path)
  }
  deleteAccountUnrecoverably(): Promise<void> {
    throw new Error('not implemented')
  }
  async lsChildren() {
    const obj = await this.readJSON<IoStruct>('.io.json')
    return Object.values(obj.branches)
  }
}
