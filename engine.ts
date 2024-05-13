import { transcribe } from './isolates/ai-prompt.ts'
import Compartment from './io/compartment.ts'
import '@std/dotenv/load'
import {
  ACTORS,
  assertValidSession,
  C,
  EngineInterface,
  freezePid,
  JsonValue,
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
import { Machine } from '@/api/web-client-machine.ts'
import * as Actor from '@/isolates/actors.ts'
import { PierceWatcher } from '@/api/web-client-watcher.ts'
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
  static async start(superuserKey: string, aesKey: string) {
    const compartment = await Compartment.create('artifact')
    const api = IsolateApi.createContext<C>()
    api.context = { aesKey }
    await compartment.mount(api)
    const engine = new Engine(compartment, api)
    await engine.ensureHomeAddress(superuserKey)
    return engine
  }
  get context() {
    return this.#api.context
  }
  get homeAddress() {
    if (!this.#homeAddress) {
      throw new Error('home not provisioned')
    }
    return this.#homeAddress
  }
  async ensureHomeAddress(superuserKey: string) {
    if (this.#homeAddress) {
      return this.#homeAddress
    }
    const { db } = artifact.sanitizeContext(this.#api)
    if (await db.hasHomeAddress()) {
      this.#homeAddress = await db.getHomeAddress()
    } else {
      await this.#provision(superuserKey)
    }
    assert(this.#homeAddress, 'home not provisioned')
    return this.#homeAddress
  }
  async stop() {
    await this.#compartment.unmount(this.#api)
  }
  get isProvisioned() {
    return !!this.#homeAddress && !!this.#githubAddress
  }
  async #provision(superuserKey: string) {
    const { db } = artifact.sanitizeContext(this.#api)
    // TODO use the effect lock to ensure atomicity
    const superuser = Machine.deriveMachineId(superuserKey)
    const { pid: homeAddress } = await this.#installHome(superuser)
    await db.setHomeAddress(homeAddress)
    this.#homeAddress = homeAddress

    const machine = Machine.load(this, superuserKey)
    const session = await machine.rootSessionPromise

    const { pid } = await session.init({
      repo: 'dreamcatcher-tech/github',
      isolate: 'github',
      params: { homeAddress },
    })
    log('github installed', print(pid))
    this.#githubAddress = pid

    const actor = await session.actions<Actor.Admin>('actors', homeAddress)
    await actor.addAuthProvider({ name: 'github', provider: pid })
  }

  async #installHome(superuser: string) {
    log('installHome superuser:', superuser)
    // TODO figure out how to know if this is a duplicate install
    const partial = { ...ACTORS, repository: 'actors' }
    const { db } = artifact.sanitizeContext(this.#api)
    const { pid } = await FS.init(partial, db)
    const abort = new AbortController()
    const watcher = PierceWatcher.create(abort.signal, this, pid)
    watcher.watchPierces()
    const request = {
      isolate: 'actors',
      functionName: '@@install',
      params: { superuser },
      proctype: PROCTYPE.SERIAL,
      target: pid,
      ulid: ulid(),
    }
    const promise = watcher.watch(request.ulid)
    await this.pierce(request)
    // TODO reverse the init if the install fails
    await promise
    abort.abort() // TODO make this a method on the watcher
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
    const { homeAddress } = this
    assertValidSession(pid, homeAddress)

    const [, , machineId, sessionId] = pid.branches
    log('createMachineSession', print(pid))
    const request = {
      isolate: 'actors',
      functionName: 'createMachineSession',
      params: { machineId, sessionId },
      proctype: PROCTYPE.SERIAL,
      target: homeAddress,
      ulid: ulid(),
    }

    // TODO either use super or check permissions
    // this would be an api gateway effect pointed at the actors repo
    await this.pierce(request)
    for await (const _splice of this.read(pid)) {
      log('splice received', print(pid))
      return
    }
  }
}
