import { transcribe } from '@/runners/runner-chat.ts'
import Compartment from './io/compartment.ts'
import {
  C,
  EngineInterface,
  freezePid,
  JsonValue,
  PID,
  pidFromRepo,
  PierceRequest,
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
  get pid() {
    if (!this.#pid) {
      const msg =
        'Root device mounted successfully, but system chain does not exist. Bailing out, you are on your own now. Good luck.'
      throw new Error(msg)
    }
    return this.#pid
  }
  async initialize() {
    // TODO make this be a pierced action ?
    // create the system chain - fail without it
    // use the system chain to create the superuser chain
    // return the details of each one

    // the system chains purpose is to:
    // 1. create and remove user accounts
    // 2. create and remove repositories

    const start = Date.now()

    const { db } = artifact.sanitizeContext(this.#api)

    // the ulid should come from context, not the repo itself?
    // the ulid of the repo is based on who is driving a command
    const systemId = '__system'
    const pid = pidFromRepo(systemId, 'system/system')

    const head = await db.readHead(pid)
    if (head) {
      return { pid, head, elapsed: Date.now() - start, existed: true }
    }

    this.#pid = pid
    const fs = await FS.init(pid, db)
    const { commit } = fs
    return { pid, head: commit, elapsed: Date.now() - start }
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
}
