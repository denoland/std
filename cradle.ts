import { transcribe } from '@/runners/runner-chat.ts'
import { diffChars } from '$diff'
import Compartment from './io/compartment.ts'
import {
  Artifact,
  C,
  DispatchFunctions,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
  Splice,
} from './constants.ts'
import { getProcType } from '@/constants.ts'
import { pidFromRepo } from '@/keys.ts'
import IsolateApi from './isolate-api.ts'
import { assert, Debug, posix, ulid } from '@utils'
import FS from '@/git/fs.ts'
import * as repo from '@/isolates/repo.ts'
import * as artifact from '@/isolates/artifact.ts'
const log = Debug('AI:cradle')

export class Cradle implements Artifact {
  #compartment: Compartment
  #api: IsolateApi<C>
  #pierce: artifact.Api['pierce']
  #readAborts = new Set<AbortController>()
  #readPromises = new Set<Promise<void>>()
  private constructor(compartment: Compartment, api: IsolateApi<C>) {
    this.#compartment = compartment
    this.#api = api
    const functions = compartment.functions<artifact.Api>(api)
    this.#pierce = functions.pierce
  }
  static async create() {
    const compartment = await Compartment.create('artifact')
    // TODO use a super PID as the cradle PID for all system actions
    const api = IsolateApi.createContext<C>()
    await compartment.mount(api)
    return new Cradle(compartment, api)
  }
  async stop() {
    for (const abort of this.#readAborts) {
      abort.abort()
    }
    await Promise.all([...this.#readPromises])
    await this.#compartment.unmount(this.#api)
  }
  async pierces<T>(isolate: string, target: PID) {
    // client side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
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
          ulid: ulid(), // must be serverside, not browser side or core side
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
    return pierces as T
  }

  //#section ARTIFACT API DIRECT CALLS
  async ping(params?: { data?: JsonValue }) {
    log('ping', params)
    await Promise.resolve()
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
    if (params?.data) {
      return params.data
    }
  }
  async pierce(params: { pierce: PierceRequest }) {
    const { pierce } = params
    const withUlid = { ...pierce, ulid: ulid() }
    await this.#pierce({ pierce: withUlid })
    return pierce.ulid
  }
  async apiSchema(params: { isolate: string }) {
    // can be edge
    const { isolate } = params
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  async transcribe(params: { audio: File }) {
    assert(params.audio instanceof File)
    const text = await transcribe(params.audio)
    return { text }
  }
  async probe(params: { repo?: string; pid?: PID }) {
    // pierce an action in using the repo isolate
    // this would be an action pierced in to the session chain ?
    // or would it be to the root chain ?
    // pierced into the session chain, relayed into the root chain
    // ? what is the pid of the root chain ? ulid, account / account
  }
  async init(params: { repo: string }) {
    const pid = pidFromRepo(params.repo)
    return { pid, head: 'head' }
  }
  async clone(params: { repo: string }) {
    const pid = pidFromRepo(params.repo)
    return { pid, head: 'head' }
  }
  async pull(params: { pid: PID }) {
    const { pid } = params
    return { pid, head: 'head' }
  }
  async push(params: { pid: PID }) {
  }
  async logs(params: { repo: string }) {
    // TODO convert logs to a splices query
    return []
  }
  async rm(params: { repo: string }) {
    log('rm', params.repo)
    // get the repo lock and atomically wipe the whole repo

    // pierce in an action for the repo isolate to remove the repo
    // if we are not authenticated, then we don't have a target PID to dispatch
    // into ?

    // as the client, I would know what my session pid was
    // pierce would carry the auth info of the client

    // we must set up the home chain first.

    // all actions are to be in a shell chain

    const m: PID = { account: '', repository: '', branches: [] }
    // what is the root chain ?
    const repoActions = await this.pierces<repo.Api>('repo', m)
    return repoActions.rm(params)
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
    const db = this.#api.context.db
    assert(db, 'db not found')
    const commits = db.watchHead(pid, abort.signal)
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
