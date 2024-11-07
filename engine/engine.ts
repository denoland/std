import { transcribe } from '../openai/ai-completions.ts'
import Compartment from '../execution/compartment.ts'
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
  Pierce,
  print,
  Proctype,
  Provisioner,
} from './constants.ts'
import * as actor from './api/isolates/actor.ts'
import NappApi from '../api/napp-api.old.ts'
import { assert, Debug, posix } from '@utils'
import FS from '@/git/fs.ts'
import * as artifact from '@/isolates/artifact.ts'
import { ulid } from 'ulid'
import { Crypto } from './api/crypto.ts'
import { PierceWatcher } from './api/watcher.ts'
import * as actors from './isolates/actors.ts'
import { Backchat } from './api/client-backchat.ts'
import { tryActorId } from '@/isolates/machines.ts'
const log = Debug('AI:engine')
type Seed = Deno.KvEntry<unknown>[]

export class Engine implements EngineInterface {
  #superuserKey: string
  #compartment: Compartment
  #api: NappApi<C>
  #pierce: artifact.Api['pierce']
  #homeAddress: PID | undefined
  #githubAddress: PID | undefined
  #abort = new AbortController()

  private constructor(
    compartment: Compartment,
    api: NappApi<C>,
    superuserKey: string,
  ) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
    this.#superuserKey = superuserKey
  }
  static async boot(superuserKey: string, aesKey: string, seed?: Seed) {
    const compartment = await Compartment.load('@artifact/engine')
    const api = NappApi.createContext<C>()
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
    // TODO collapse this to be same as server, so never gets called
    const engine = await Engine.boot(superuserKey, aesKey, seed)
    await engine.ensureHomeAddress(init)
    return engine
  }
  superUser(): Backchat {
    const crypto = Crypto.load(this.#superuserKey)
    return Backchat.superuser(this, crypto)
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
    const actorId = generateActorId()
    const actor = addBranches(this.homeAddress, actorId)
    const backchatId = generateBackchatId()
    const backchat = addBranches(actor, backchatId)

    const target = this.homeAddress
    const su = this.superUser()
    const actions = await su.actions<actors.Api>('actors', { target })
    await actions.createActor({ actorId, machineId, backchatId })

    return backchat
  }
  async #createBackchat(target: PID) {
    // TODO assert is actor PID
    // TODO this should really be done by the actor
    // so the request should include a pierce to create a new one in case the
    // resume doesn't work, since SU takes time
    const su = this.superUser()
    const { backchat } = await su.actions<actor.Api>('actor', {
      target,
    })
    const backchatId = generateBackchatId()
    const pid = await backchat({ backchatId })
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
    this.#abort.abort()
    await this.#compartment.unmount(this.#api)
    // attempt to let the subtle digest call clean up
    await new Promise<void>((resolve) => setTimeout(() => resolve()))
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
    const pierce: Pierce = {
      target: this.homeAddress,
      ulid: ulid(),
      isolate: 'actors',
      functionName: '@@install',
      params: { superuser },
      proctype: Proctype.enum.SERIAL,
    }
    const promise = watcher.watch(pierce.ulid)

    // notably, this is the only non terminal pierce in the whole system
    await this.pierce(pierce)
    // TODO sign the pierce since superuser is already present
    log('pierced', print(this.homeAddress))
    await promise
    abort.abort() // TODO make this a method on the watcher
    const su = this.superUser()
    log('superuser is', print(su.pid))

    if (!init) {
      log('no init function - returning')
      return
    }

    log('provisioning')
    await init(su)
    log('provisioned')
  }
  ping(data?: JsonValue): Promise<JsonValue | undefined> {
    log('ping', data)
    return Promise.resolve(data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
  async transcribe(audio: File) {
    assert(audio instanceof File, 'audio must be a File')
    const text = await transcribe(audio)
    return { text }
  }
  async pierce(pierce: Pierce) {
    await this.#pierce({ pierce })
  }
  watch(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
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
  async splice(
    target: PID,
    opts: { commit?: string; path?: string; count?: number } = {},
  ) {
    let { commit, path, count = 1 } = opts
    log('splice', print(target), commit, path, count)
    const db = this.#api.context.db
    assert(db, 'db not found')

    if (!commit) {
      commit = await db.readHead(target)
    }
    if (!commit) {
      throw new Error('commit not found: ' + print(target))
    }
    const splices = []
    const commits = [commit]
    while (splices.length < count) {
      const commit = commits.shift()
      if (!commit) {
        break
      }
      const splice = await db.getSplice(target, commit, path)
      splices.push(splice)
      commits.push(...splice.commit.parent)
    }

    return splices
  }
  async read(path: string, pid: PID, commit?: string) {
    const fs = await this.#openFs(pid, commit)
    log('read', path, print(pid))
    return fs.read(path)
  }
  async readTree(path: string, pid: PID, commit?: string) {
    const fs = await this.#openFs(pid, commit)
    log('readTree', path, print(pid))
    return fs.readTree(path)
  }
  async readJSON<T>(path: string, pid: PID, commit?: string) {
    const fs = await this.#openFs(pid, commit)
    log('readJSON', path, print(pid))
    return fs.readJSON<T>(path)
  }
  async readBinary(path: string, pid: PID, commit?: string) {
    const fs = await this.#openFs(pid, commit)
    log('readBinary', path, print(pid))
    return fs.readBinary(path)
  }
  async #openFs(pid: PID, commit?: string) {
    freezePid(pid)

    const db = this.#api.context.db
    assert(db, 'db not found')
    let fs
    if (commit) {
      fs = FS.open(pid, commit, db)
    } else {
      fs = await FS.openHead(pid, db)
    }
    return fs
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
