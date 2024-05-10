import { transcribe } from './isolates/ai-prompt.ts'
import Compartment from './io/compartment.ts'
import {
  ACTORS,
  assertValidSession,
  C,
  EngineInterface,
  freezePid,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  print,
  PROCTYPE,
} from './constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, posix } from '@utils'
import FS from '@/git/fs.ts'
import * as artifact from '@/isolates/artifact.ts'
import { ulid } from 'ulid'
const log = Debug('AI:engine')

export class Engine implements EngineInterface {
  #compartment: Compartment
  #api: IsolateApi<C>
  #pierce: artifact.Api['pierce']
  #homeAddress: PID | undefined
  #githubAddress: PID | undefined

  private constructor(compartment: Compartment, api: IsolateApi<C>) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
  }
  static async start() {
    const compartment = await Compartment.create('artifact')
    const api = IsolateApi.createContext<C>()
    await compartment.mount(api)
    return new Engine(compartment, api)
  }
  get context() {
    return this.#api.context
  }
  get homeAddress() {
    if (!this.#homeAddress) {
      throw new Error('home not installed')
    }
    return this.#homeAddress
  }
  get githubAddress() {
    if (!this.#githubAddress) {
      throw new Error('github not installed')
    }
    return this.#githubAddress
  }
  async stop() {
    await this.#compartment.unmount(this.#api)
  }
  get isProvisioned() {
    return !!this.#homeAddress && !!this.#githubAddress
  }
  async provision() {
    if (!this.#homeAddress) {
      const { pid } = await this.#install('actors')
      // TODO make this connect up this host as a machine to the superuser
      this.#homeAddress = pid
    }
    if (!this.#githubAddress) {
      const { homeAddress } = this
      const { pid } = await this.#install('github', { homeAddress })
      this.#githubAddress = pid
    }
  }
  /**
   * Installs isolates as the superuser account.  Used to provision the engine.
   */
  async #install(isolate: string, params: Params = {}) {
    log('install', isolate, params)
    // TODO figure out how to know if this is a duplicate install
    // this should be an action via the superuser home account ?
    const partial = { ...ACTORS, repository: isolate }
    const { db } = artifact.sanitizeContext(this.#api)
    const { pid } = await FS.init(partial, db)
    await this.pierce({
      isolate,
      functionName: '@@install',
      params,
      proctype: PROCTYPE.SERIAL,
      target: pid,
      ulid: ulid(),
    })
    // TODO fire an error if this isolate is not installable
    log('installed', print(pid))
    const { oid } = await FS.openHead(pid, db)
    return { pid, head: oid }
  }
  ping(data?: JsonValue): Promise<JsonValue | undefined> {
    log('ping', data)
    return Promise.resolve(data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
  async apiSchema(isolate: string) {
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  async transcribe(audio: File) {
    assert(audio instanceof File, 'audio must be a File')
    const text = await transcribe(audio)
    return { text }
  }
  async pierce(pierce: PierceRequest) {
    await this.#pierce({ pierce })
  }
  read(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    freezePid(pid)
    assert(!path || !posix.isAbsolute(path), `path must be relative: ${path}`)

    const db = this.#api.context.db
    assert(db, 'db not found')
    return db.watchSplices(pid, path, after, signal)
  }
  async readJSON<T>(path: string, pid: PID) {
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    const fs = await FS.openHead(pid, db)
    return fs.readJSON<T>(path)
  }
  async exists(path: string, pid: PID): Promise<boolean> {
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    const fs = await FS.openHead(pid, db)
    return fs.exists(path)
  }
  async createMachineSession(pid: PID) {
    assert(this.#homeAddress, 'home not connected')
    assertValidSession(pid, this.#homeAddress)
    const [, , machineId, sessionId] = pid.branches
    log('createMachineSession', print(pid))
    const request = {
      isolate: 'actors',
      functionName: 'createMachineSession',
      params: { machineId, sessionId },
      proctype: PROCTYPE.SERIAL,
      target: this.homeAddress,
      ulid: ulid(),
    }

    await this.pierce(request)
    for await (const _splice of this.read(pid)) {
      log('splice received', print(pid))
      return
    }
  }
}
