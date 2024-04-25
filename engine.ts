import { transcribe } from './isolates/ai-prompt.ts'
import Compartment from './io/compartment.ts'
import {
  C,
  EngineInterface,
  freezePid,
  JsonValue,
  PID,
  PierceRequest,
  SUPERUSER,
} from './constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, posix } from '@utils'
import FS from '@/git/fs.ts'
import * as artifact from '@/isolates/artifact.ts'
const log = Debug('AI:engine')

export class Engine implements EngineInterface {
  #compartment: Compartment
  #api: IsolateApi<C>
  #pierce: artifact.Api['pierce']
  #pid: PID | undefined
  private constructor(compartment: Compartment, api: IsolateApi<C>) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
  }
  static async create() {
    const compartment = await Compartment.create('artifact')
    const api = IsolateApi.createContext<C>()
    await compartment.mount(api)
    return new Engine(compartment, api)
  }
  get context() {
    return this.#api.context
  }
  get pid() {
    if (!this.#pid) {
      const msg =
        'Root device mounted successfully, but system chain does not exist. Bailing out, you are on your own now. Good luck.'
      throw new Error(msg)
    }
    return this.#pid
  }
  async bootSuperUser() {
    // the system chains purpose is to:
    // 1. create and remove user accounts
    // 2. create and remove repositories

    const start = Date.now()

    const { db } = artifact.sanitizeContext(this.#api)

    // the ulid should come from context, not the repo itself?
    // the ulid of the repo is based on who is driving a command
    const pid = SUPERUSER

    const head = await db.readHead(pid)
    if (head) {
      return { pid, head, elapsed: Date.now() - start, existed: true }
    }

    this.#pid = pid

    const { oid } = await FS.init(pid, db)
    return { pid, head: oid, elapsed: Date.now() - start }
  }
  async stop() {
    await this.#compartment.unmount(this.#api)
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
}
