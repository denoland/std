import { transcribe } from './isolates/ai-prompt.ts'
import Compartment from './io/compartment.ts'
import '@std/dotenv/load'
import {
  ACTORS,
  ArtifactSession,
  assertValidSession,
  C,
  colorize,
  EngineInterface,
  freezePid,
  JsonValue,
  PID,
  PierceRequest,
  print,
  PROCTYPE,
  Provisioner,
  ROOT_SESSION,
} from './constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, posix } from '@utils'
import FS from '@/git/fs.ts'
import * as artifact from '@/isolates/artifact.ts'
import { ulid } from 'ulid'
import { Machine } from '@/api/web-client-machine.ts'
import { PierceWatcher } from '@/api/web-client-watcher.ts'
import { ActorAdmin } from '@/isolates/actors.ts'
const log = Debug('AI:engine')

export class Engine implements EngineInterface {
  #superuserKey: string
  #compartment: Compartment
  #api: IsolateApi<C>
  #pierce: artifact.Api['pierce']
  #homeAddress: PID | undefined
  #githubAddress: PID | undefined
  #abort = new AbortController()

  private constructor(
    compartment: Compartment,
    api: IsolateApi<C>,
    superuserKey: string,
  ) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
    this.#superuserKey = superuserKey
  }
  static async start(superuserKey: string, aesKey: string, init?: Provisioner) {
    const compartment = await Compartment.create('artifact')
    const api = IsolateApi.createContext<C>()
    api.context = { aesKey }
    await compartment.mount(api)
    const engine = new Engine(compartment, api, superuserKey)
    await engine.ensureHomeAddress(superuserKey, init)
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
  async ensureHomeAddress(superuserKey: string, init?: Provisioner) {
    if (this.#homeAddress) {
      return this.#homeAddress
    }
    const { db } = artifact.sanitizeContext(this.#api)
    if (await db.hasHomeAddress()) {
      this.#homeAddress = await db.getHomeAddress()
    } else {
      await this.#provision(superuserKey, init)
    }
    assert(this.#homeAddress, 'home not provisioned')
    return this.#homeAddress
  }
  get abortSignal() {
    return this.#abort.signal
  }
  async stop() {
    await this.#compartment.unmount(this.#api)
    this.#abort.abort()
  }
  get isProvisioned() {
    return !!this.#homeAddress && !!this.#githubAddress
  }
  async #provision(superuserPrivateKey: string, init?: Provisioner) {
    const { db } = artifact.sanitizeContext(this.#api)
    // TODO use the effect lock to ensure atomicity
    const superuser = Machine.deriveMachineId(superuserPrivateKey)
    const homeAddress = await this.#installHome(superuser)
    await db.setHomeAddress(homeAddress)
    this.#homeAddress = homeAddress

    if (!init) {
      return
    }

    const terminal = await this.#su()
    await init(terminal)
  }
  #superuser: Promise<ArtifactSession> | undefined
  #su() {
    if (!this.#superuser) {
      const machine = Machine.load(this, this.#superuserKey)
      this.#superuser = machine.rootTerminalPromise
    }
    return this.#superuser
  }

  async #installHome(superuser: string) {
    log('installHome superuser:', colorize(superuser))
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

    // notably, this is the only unauthenticated pierce in the whole system
    await this.pierce(request)
    // TODO reverse the init if the install fails
    await promise
    abort.abort() // TODO make this a method on the watcher
    log('installed', print(pid))
    return pid
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
    const abort = new AbortController()
    signal?.addEventListener('abort', () => abort.abort())
    this.#abort.signal.addEventListener('abort', () => abort.abort())
    return db.watchSplices(pid, path, after, abort.signal)
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
  async ensureMachineTerminal(machinePid: PID) {
    const { homeAddress } = this
    // TODO require some signature proof from the machine
    const rootPid = createRootPid(machinePid)
    assertValidSession(rootPid, homeAddress)

    log('ensureMachineTerminal', print(machinePid))
    const [, , machineId] = machinePid.branches

    if (await this.isTerminalAvailable(rootPid)) {
      log('machinePid already exists', print(machinePid))
      return
    }

    const su = await this.#su()
    const actions = await su.actions<ActorAdmin>('actors', homeAddress)
    await actions.ensureMachineTerminal({ machineId })
  }
  async isTerminalAvailable(pid: PID): Promise<boolean> {
    // TODO restrict to only be a child of a machine, and the only sender
    freezePid(pid)
    const db = this.#api.context.db
    assert(db, 'db not found')
    const head = await db.readHead(pid)
    return !!head
  }
}

const createRootPid = (pid: PID) => {
  const branches = [...pid.branches, ROOT_SESSION]
  return { ...pid, branches }
}
