import { toTreeSync } from 'https://esm.sh/memfs@4.6.0/lib/print'
import IO from './io/io.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
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
  ProcessAddress,
  PROCTYPES,
} from './constants.ts'
import DB from './db.ts'

const log = debug('AI:api')

export default class Artifact {
  #io!: IO
  #db!: DB
  static async create() {
    const artifact = new Artifact()
    artifact.#db = await DB.create()
    await artifact.start()
    return artifact
  }
  get io() {
    return this.#io
  }
  async start() {
    this.#db = await DB.create()
    this.#io = IO.create(this, this.#db)
    this.#io.listen()
  }
  stop() {
    this.#db.stop()
  }
  async pull(repo: string) {
    // TODO split this out to a dedicated network git module
    const [account, repository] = repo.split('/')
    // TODO acquire lock on the repo in the kv store ?
    // TODO handle existing repo

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, noCheckout: true })
    log('cloned')
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('snapshot', pretty(uint8.length))
    const pid: ProcessAddress = {
      account,
      repository,
      branches: [ENTRY_BRANCH],
    }
    await this.#db.updateIsolateFs(pid, uint8)
  }
  push(repo: string) {
    throw new Error('not implemented: ' + repo)
  }
  async workerApi(isolate: string) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const api = await this.#io.workerApi(isolate)
    return api
  }
  async actions(isolate: string, pid: ProcessAddress) {
    log('actions for isolate: %s pid: %o ', isolate, pid)
    const api = await this.workerApi(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(api)) {
      actions[functionName] = (parameters = {}, proctype = PROCTYPES.SELF) =>
        this.#io.dispatch({ pid, isolate, functionName, parameters, proctype })
    }
    log('actions', isolate, Object.keys(actions))
    return actions
  }
  async isolateFs(pid: ProcessAddress) {
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
  async updateIsolateFs(pid: ProcessAddress, fs: IFs) {
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('updateIsolateFs', pretty(uint8.length))
    await this.#db.updateIsolateFs(pid, uint8)
  }
}
