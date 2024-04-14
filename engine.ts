import { transcribe } from '@/runners/runner-chat.ts'
import { diffChars } from 'diff'
import Compartment from './io/compartment.ts'
import {
  C,
  EngineInterface,
  JsonValue,
  PID,
  pidFromRepo,
  PierceRequest,
  Splice,
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
  #readAborts = new Set<AbortController>()
  #readPromises = new Set<Promise<void>>()
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
    this.#pid = pid
    const fs = await FS.init(pid, db)
    const { commit: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  }
  async stop() {
    for (const abort of this.#readAborts) {
      abort.abort()
    }
    await Promise.all([...this.#readPromises])
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
  read(pid: PID, path?: string, signal?: AbortSignal) {
    // buffer transients until we get up to the current commit
    // if we pass the current commit in transients, reset what head is
    // TODO use commit logs to ensure we emit one splice for every commit
    assert(!path || !posix.isAbsolute(path), `path must be relative: ${path}`)

    const abort = new AbortController()
    if (signal) {
      signal.addEventListener('abort', () => {
        abort.abort()
      })
    }
    const finished = this.#waiter(abort)

    let last: string
    const db = this.#api.context.db
    assert(db, 'db not found')
    const testLatencies = async () => {
      const rawlog = log.extend('raw')
      for await (const commit of db.watchHead(pid, abort.signal)) {
        rawlog('raw commit:', commit)
      }
    }
    testLatencies()
    const commits = db.watchHead(pid, abort.signal)
    const readlog = log.extend('read')
    const buffer: Promise<void>[] = []
    const toSplices = new TransformStream<string, Splice>({
      transform: (oid, controller) => {
        // TODO check the commits are not interupted
        const process = async () => {
          readlog('commit', oid, path)
          const fs = FS.open(pid, oid, db)
          const commit = await fs.getCommit()
          let changes
          if (path) {
            readlog('read path', path, oid)
            if (await fs.exists(path)) {
              readlog('file exists', path, oid)
              const content = await fs.read(path)
              if (last === undefined || last !== content) {
                readlog('content changed')
                // TODO use json differ for json
                changes = diffChars(last || '', content)
                last = content
              }
            }
          }

          const timestamp = commit.committer.timestamp * 1000
          const splice: Splice = { pid, oid, commit, timestamp, path, changes }
          return splice
        }
        const task = process()
        const index = buffer.length
        const priorTask = buffer[index - 1] || Promise.resolve()
        const queuedTask = priorTask.then(() => task).then((splice) => {
          if (!abort.signal.aborted) {
            controller.enqueue(splice)
          }
        }).finally(() => {
          buffer.shift()
        })
        buffer.push(queuedTask)
      },
    })
    commits.pipeTo(toSplices.writable)
      .then(() => {
        log('pipeTo done')
      }).catch((_error) => {
        // silence as only used during testing
      })
      .then(() => {
        finished()
        log('stream complete')
      })
    return toSplices.readable
  }
  #waiter(abort: AbortController) {
    let resolve: () => void
    const readPromise = new Promise<void>((_resolve) => {
      resolve = _resolve
    })
    this.#readPromises.add(readPromise)
    this.#readAborts.add(abort)
    return () => {
      resolve()
      this.#readPromises.delete(readPromise)
      this.#readAborts.delete(abort)
    }
  }
}
