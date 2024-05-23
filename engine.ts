import { transcribe } from './isolates/ai-prompt.ts'
import Compartment from './io/compartment.ts'
import '@std/dotenv/load'
import {
  ACTORS,
  ArtifactSession,
  assertValidTerminal,
  C,
  colorize,
  EngineInterface,
  freezePid,
  isPID,
  JsonValue,
  PID,
  PierceRequest,
  print,
  PROCTYPE,
  Provisioner,
  ROOT_SESSION,
  UnsequencedRequest,
} from './constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, equal, posix } from '@utils'
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
    if (this.#homeAddress && !this.#isDropping) {
      return
    }
    log('ensureHomeAddress querying db')
    const { db } = artifact.sanitizeContext(this.#api)
    if (!await db.hasHomeAddress()) {
      log('homeAddress not found in db')
      const lockId = await db.lockDB()
      if (lockId) {
        log('locked db', lockId)
        await this.#provision(superuserKey, init)
        assert(this.#homeAddress, 'home not provisioned')
        log('homeAddress provisioned', print(this.#homeAddress))
        await db.unlockDB(lockId)
        return
      }
    }
    this.#homeAddress = await db.getHomeAddress()

    log('homeAddress found in db', print(this.#homeAddress))
    if (this.#isDropping) {
      await this.#dropDB()
    }
    this.ensureHomeAddress(superuserKey, init)
  }
  get #isDropping() {
    const toDelete = Deno.env.get('DROP_HOME')
    return toDelete === this.homeAddress.repoId
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
      log('no init function - returning')
      return
    }

    const terminal = await this.#su()
    log('provisioning', print(homeAddress))
    await init(terminal)
    log('provisioned', print(homeAddress))
    log('superuser is', colorize(superuser))
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
    // TODO move this to be dedicated artifact isolate function
    const request: UnsequencedRequest = {
      isolate: 'actors',
      functionName: '@@install',
      params: { superuser },
      proctype: PROCTYPE.SERIAL,
      target: pid,
    }
    const pierce: PierceRequest = {
      target: pid,
      ulid: ulid(),
      isolate: 'shell',
      functionName: 'pierce',
      params: { request },
      proctype: PROCTYPE.SERIAL,
    }
    const promise = watcher.watch(pierce.ulid)

    // notably, this is the only unauthenticated pierce in the whole system
    await this.pierce(pierce)
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
    log('readJSON', path, print(pid))
    return fs.readJSON<T>(path)
  }
  async exists(path: string, pid: PID): Promise<boolean> {
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    const fs = await FS.openHead(pid, db)
    log('exists', path, print(pid))
    return fs.exists(path)
  }
  async ensureMachineTerminal(machinePid: PID) {
    const { homeAddress } = this
    // TODO require some signature proof from the machine
    const rootPid = createRootPid(machinePid)
    assertValidTerminal(rootPid, homeAddress)

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
  async ensureBranch(pierce: PierceRequest) {
    const { request } = pierce.params
    assert(request.isolate === 'actors', 'only actors can ensureBranch')
    assert(equal(request.target, pierce.target), 'target mismatch')
    const { branch, ancestor } = request.params
    assert(isPID(branch), 'branch must be a PID')
    assert(isPID(ancestor), 'ancestor must be a PID')
    // TODO assert this is an ensure request
    // TODO verify that the branch is a child of the ancestor

    log('ensureBranch branch', print(branch))
    log('ensureBranch ancestor', print(ancestor))
    const { db } = artifact.sanitizeContext(this.#api)
    const head = await db.readHead(branch)
    if (!head) {
      log('branch not found', print(branch))
      await this.pierce(pierce)
    }
    log('pierce done')
  }
  async #dropDB() {
    log('dropping homeAddress', print(this.#homeAddress))
    const { db } = artifact.sanitizeContext(this.#api)
    await db.drop()
    this.#homeAddress = undefined
    await db.drop()
  }
}

const createRootPid = (pid: PID) => {
  const branches = [...pid.branches, ROOT_SESSION]
  return { ...pid, branches }
}
