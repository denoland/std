import { diffChars } from '$diff'
import Compartment from './io/compartment.ts'
import {
  Artifact,
  ArtifactCradle,
  DispatchFunctions,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
  Splice,
} from './constants.ts'
import { getProcType } from '@/constants.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, posix } from '@utils'
import { ulid } from 'std/ulid/mod.ts'
import { C } from './isolates/artifact.ts'
import FS from '@/git/fs.ts'
const log = Debug('AI:cradle')

export class Cradle implements ArtifactCradle {
  #compartment: Compartment
  #api: IsolateApi<C>
  #functions: Artifact
  #readAborts = new Set<AbortController>()
  #readPromises = new Set<Promise<void>>()
  private constructor(compartment: Compartment, api: IsolateApi<C>) {
    this.#compartment = compartment
    this.#api = api
    this.#functions = compartment.functions<Artifact>(api)
  }
  static async create() {
    const compartment = await Compartment.create('artifact')
    // TODO use a super PID as the cradle PID for all system actions
    const api = IsolateApi.createContext()
    await compartment.mount(api)
    assert(api.context.db, 'db not found')

    const functions = compartment.functions(api)
    assert(!functions.stop, 'stop is a reserved function')
    assert(!functions.pierces, 'pierces is a reserved function')
    return new Cradle(compartment, api)
  }
  async stop() {
    for (const abort of this.#readAborts) {
      abort.abort()
    }
    await Promise.all([...this.#readPromises])
    await this.#compartment.unmount(this.#api)
  }
  async pierces(isolate: string, target: PID) {
    // cradle side, since functions cannot be returned from isolate calls
    const apiSchema = await this.#functions.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params?: Params,
        options?: ProcessOptions,
      ) => {
        log('pierces %o', functionName)
        const proctype = getProcType(options)
        const pierce: PierceRequest = {
          target,
          ulid: ulid(), // important to be done serverside, not web side
          isolate,
          functionName,
          params: params || {},
          // TODO pass the process options straight thru ?
          proctype,
        }
        return this.pierce({ pierce })
      }
    }
    log('pierces:', isolate, Object.keys(pierces))
    return pierces
  }

  // ARTIFACT API DIRECT CALLS
  ping(params?: Params) {
    return this.#functions.ping(params)
  }
  pierce(params: { pierce: PierceRequest }) {
    return this.#functions.pierce(params)
  }
  probe(params: { repo?: string; pid?: PID }) {
    return this.#functions.probe(params)
  }
  init(params: { repo: string }) {
    return this.#functions.init(params)
  }
  clone(params: { repo: string }) {
    return this.#functions.clone(params)
  }
  pull(params: { pid: PID }) {
    return this.#functions.pull(params)
  }
  push(params: { pid: PID }) {
    return this.#functions.push(params)
  }
  rm(params: { repo: string }) {
    return this.#functions.rm(params)
  }
  apiSchema(params: { isolate: string }) {
    return this.#functions.apiSchema(params)
  }
  transcribe(params: { audio: File }) {
    return this.#functions.transcribe(params)
  }
  logs(params: { repo: string }) {
    return this.#functions.logs(params)
  }

  // TODO shunt all read operations out to a separate Query class
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
    const commits = this.#api.context.db!.watchHead(pid, abort.signal)
    const db = this.#api.context.db
    assert(db, 'db not found')
    const toSplices = new TransformStream<string, Splice>({
      transform: async (oid, controller) => {
        log('commit', oid, path)
        const fs = FS.open(pid, oid, db)
        log('fs loaded')
        const commit = await fs.getCommit()
        let changes
        if (path) {
          log('read path', path, oid)
          if (await fs.exists(path)) {
            log('file exists', path, oid)
            const content = await fs.read(path)
            if (last === undefined || last !== content) {
              log('content changed')
              // TODO use json differ for json
              changes = diffChars(last || '', content)
              last = content
            }
          }
        }

        const timestamp = commit.committer.timestamp * 1000
        const splice: Splice = { pid, oid, commit, timestamp, path, changes }
        controller.enqueue(splice)
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
}

export default Cradle
