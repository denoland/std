import { transcribe } from './isolates/ai-completions.ts'
import Compartment from './io/compartment.ts'
import '@std/dotenv/load'
import {
  addBranches,
  backchatIdRegex,
  C,
  EngineInterface,
  freezePid,
  generateActorId,
  generateBackchatId,
  HAL,
  JsonValue,
  PID,
  PierceRequest,
  print,
  PROCTYPE,
  Provisioner,
} from './constants.ts'
import IA from './isolate-api.ts'
import { assert, Debug, posix } from '@utils'
import FS from '@/git/fs.ts'
import * as artifact from '@/isolates/artifact.ts'
import { ulid } from 'ulid'
import { Crypto } from '@/api/web-client-crypto.ts'
import { PierceWatcher } from '@/api/web-client-watcher.ts'
import { ActorAdmin, ActorApi } from '@/isolates/actors.ts'
import { Backchat } from '@/api/web-client-backchat.ts'
import { tryActorId } from '@/isolates/machines.ts'
const log = Debug('AI:engine')
type Seed = Deno.KvEntry<unknown>[]

export class Engine implements EngineInterface {
  #superuserKey: string
  #compartment: Compartment
  #api: IA<C>
  #pierce: artifact.Api['pierce']
  #homeAddress: PID | undefined
  #githubAddress: PID | undefined
  #abort = new AbortController()
  #suBackchat: Backchat | undefined

  private constructor(
    compartment: Compartment,
    api: IA<C>,
    superuserKey: string,
  ) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
    this.#superuserKey = superuserKey
  }
  static async boot(superuserKey: string, aesKey: string, seed?: Seed) {
    const compartment = await Compartment.create('artifact')
    const api = IA.createContext<C>()
    api.context = { aesKey, seed }
    await compartment.mount(api)
    const engine = new Engine(compartment, api, superuserKey)
    return engine
  }
  static async provision(
    superuserKey: string,
    aesKey: string,
    init?: Provisioner,
    seed?: Seed,
  ) {
    const engine = await Engine.boot(superuserKey, aesKey, seed)
    await engine.ensureHomeAddress(init)
    return engine
  }
  get #su() {
    if (!this.#suBackchat) {
      const crypto = Crypto.load(this.#superuserKey)
      this.#suBackchat = Backchat.superuser(this, crypto)
    }
    assert(this.#suBackchat)
    return this.#suBackchat
  }
  get #isDropping() {
    const toDelete = Deno.env.get('DROP_HOME') || ''
    const isDropping = toDelete.trim() === this.homeAddress.repoId
    isDropping && log('isDropping', isDropping)
    return isDropping
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
  get abortSignal() {
    return this.#abort.signal
  }
  get isProvisioned() {
    return !!this.#homeAddress && !!this.#githubAddress
  }
  async upsertBackchat(machineId: string, resume?: string) {
    // TODO handshake to prove the machineId is valid
    Crypto.assert(machineId)
    assert(!resume || backchatIdRegex.test(resume), 'invalid resume')
    const { db } = artifact.sanitizeContext(this.#api)

    const machines = addBranches(this.homeAddress, 'machines')
    const machineFs = await FS.openHead(machines, db)
    let actor: PID

    const actorId = await tryActorId(machineId, machineFs)
    if (actorId) {
      actor = addBranches(this.homeAddress, actorId)
    } else {
      return this.#createActor(machineId)
    }
    if (resume) {
      const resumedBackchat = addBranches(actor, resume)
      if (await db.readHead(resumedBackchat)) {
        return resumedBackchat
      }
    }
    return this.#createBackchat(actor)
  }
  async #createActor(machineId: string) {
    Crypto.assert(machineId)
    const actorId = generateActorId(ulid())
    const actor = addBranches(this.homeAddress, actorId)
    const backchatId = generateBackchatId(ulid())
    const backchat = addBranches(actor, backchatId)

    const target = this.homeAddress
    const actions = await this.#su.actions<ActorAdmin>('actors', { target })
    await actions.createActor({ actorId, machineId, backchatId })

    return backchat
  }
  async #createBackchat(target: PID) {
    // TODO assert is actor PID
    const actions = await this.#su.actions<ActorApi>('actors', { target })
    const backchatId = generateBackchatId(ulid())
    const pid = await actions.backchat({ backchatId })
    return freezePid(pid)
  }
  async ensureHomeAddress(init?: Provisioner) {
    if (this.#homeAddress) {
      return
    }

    log('ensureHomeAddress querying db')
    const { db } = artifact.sanitizeContext(this.#api)
    if (await db.hasHomeAddress()) {
      this.#homeAddress = await db.awaitHomeAddress()
      log('homeAddress found in db', print(this.#homeAddress))
    }

    if (!this.#homeAddress || this.#isDropping) {
      const lockId = await db.lockDbProvisioning()
      if (lockId) {
        log('dropping db')
        await this.#dropDB()
        log('db drop complete')

        log('initializing homeAddress')
        this.#homeAddress = await this.#initHome()
        await db.setHomeAddress(this.#homeAddress)
        log('homeAddress initialized to:', print(this.#homeAddress))

        await this.#provision(init)
        await db.unlockDbProvisioning(lockId)
        log('unlocked db', lockId)
      }
    }
    // importantly, this blocks only web requests, not queue processing
    await db.awaitDbProvisioning()
    this.#homeAddress = await db.awaitHomeAddress()
    log('db unlocked - home address:', print(this.#homeAddress))
  }
  async stop() {
    await this.#compartment.unmount(this.#api)
    this.#abort.abort()
  }
  async #initHome() {
    // queue processing cannot begin without a home repo
    log('initHome')
    const { db } = artifact.sanitizeContext(this.#api)
    const repo = `${HAL.account}/${HAL.repository}`
    const fs = await FS.clone(repo, db)
    log('initialized home', print(fs.pid))
    return fs.pid
  }
  async #provision(init?: Provisioner) {
    const abort = new AbortController()

    const watcher = PierceWatcher.create(abort.signal, this, this.homeAddress)
    watcher.watchPierces()
    const { machineId: superuser } = Crypto.load(this.#superuserKey)
    const pierce: PierceRequest = {
      target: this.homeAddress,
      ulid: ulid(),
      isolate: 'actors',
      functionName: '@@install',
      params: { superuser },
      proctype: PROCTYPE.SERIAL,
    }
    const promise = watcher.watch(pierce.ulid)

    // notably, this is the only non terminal pierce in the whole system
    await this.pierce(pierce)
    // TODO sign the pierce since superuser is already present
    log('pierced', print(this.homeAddress))
    await promise
    abort.abort() // TODO make this a method on the watcher
    log('superuser is', print(this.#su.pid))

    if (!init) {
      log('no init function - returning')
      return
    }

    log('provisioning')
    await init(this.#su)
    log('provisioned')
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
    // TODO read should take a triad and should not require strict sequence
    freezePid(pid)
    assert(!path || !posix.isAbsolute(path), `path must be relative: ${path}`)

    const db = this.#api.context.db
    assert(db, 'db not found')
    const abort = new AbortController()
    signal?.addEventListener('abort', () => abort.abort())
    this.#abort.signal.addEventListener('abort', () => abort.abort())
    return db.watchSplices(pid, path, after, abort.signal)
  }
  async readJSON<T>(path: string, pid: PID, commit?: string) {
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    let fs
    if (commit) {
      fs = FS.open(pid, commit, db)
    } else {
      fs = await FS.openHead(pid, db)
    }

    log('readJSON', path, print(pid))
    return fs.readJSON<T>(path)
  }
  async exists(path: string, pid: PID): Promise<boolean> {
    // TODO convert to triad
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    const fs = await FS.openHead(pid, db)
    log('exists', path, print(pid))
    return fs.exists(path)
  }
  async #dropDB() {
    log('dropping homeAddress', print(this.#homeAddress))
    const { db } = artifact.sanitizeContext(this.#api)
    await db.drop()
  }
  dump() {
    const { db } = artifact.sanitizeContext(this.#api)
    return db.dump()
  }
}
