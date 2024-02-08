import IO from './io/io.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import debug from '$debug'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import { assert } from 'std/assert/mod.ts'
import {
  CborUint8Array,
  DispatchFunctions,
  ENTRY_BRANCH,
  PID,
  PROCTYPE,
  QueuedMessage,
} from '@/artifact/constants.ts'
import DB from './db.ts'
import { ulid } from 'std/ulid/mod.ts'

const log = debug('AI:api')

export default class Artifact implements Artifact {
  #io!: IO
  #db!: DB
  static async create() {
    // https://github.com/isomorphic-git/isomorphic-git/pull/1864
    globalThis.CompressionStream =
      undefined as unknown as typeof globalThis.CompressionStream

    const artifact = new Artifact()
    artifact.#db = await DB.create()
    artifact.#io = IO.create(artifact, artifact.#db)
    artifact.#io.listen()
    return artifact
  }
  get io() {
    return this.#io
  }
  stop() {
    this.#db.stop()
  }
  async pull(repo: string) {
    // TODO split this out to a dedicated network git module
    const [account, repository] = repo.split('/')
    // TODO acquire lock on the repo in the kv store
    // TODO handle existing repo

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, noCheckout: true })
    log('cloned')
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('snapshot', pretty(uint8.length))
    const pid: PID = {
      account,
      repository,
      branches: [ENTRY_BRANCH],
    }
    await this.#db.updateIsolateFs(pid, uint8)
  }
  push(repo: string) {
    throw new Error('not implemented: ' + repo)
  }
  clone(repo: string) {
    // clone a git repo into artifact
  }
  init(repo: string) {
    // initialize a blank git repo, ensuring no name collisions
  }
  async isolateApi(isolate: string) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const api = await this.#io.workerApi(isolate)
    return api
  }
  async actions(isolate: string, pid: PID) {
    // this will be done client side
    log('actions for isolate: %s pid: %o ', isolate, pid)
    const api = await this.isolateApi(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(api)) {
      actions[functionName] = (parameters = {}, proctype = PROCTYPE.SERIAL) => {
        const nonce = ulid()
        return this.#io.dispatch({
          pid,
          isolate,
          functionName,
          parameters,
          proctype,
          nonce, // this should be formulaic for chain to chain
        })
      }
    }
    log('actions', isolate, Object.keys(actions))
    return actions
  }
  async isolateFs(pid: PID) {
    const uint8 = await this.#db.loadIsolateFs(pid)
    if (!uint8) {
      const repo = `${pid.account}/${pid.repository}`
      throw new Error('repo not found - pull first: ' + repo)
    }
    const snapshotData = uint8 as CborUint8Array<snapshot.SnapshotNode>
    log('reloaded: repo', pretty(uint8.length))
    // TODO cache locally in case we get reused
    const { fs } = memfs()
    // TODO use unionFs to make layers for each branch
    snapshot.fromBinarySnapshotSync(snapshotData, { fs })
    // log('snapshot loaded', toTreeSync(fs))
    return fs
  }
  async updateIsolateFs(pid: PID, fs: IFs) {
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('updateIsolateFs', pretty(uint8.length))
    await this.#db.updateIsolateFs(pid, uint8)
  }
}
