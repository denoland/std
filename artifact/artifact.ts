import { toTreeSync } from 'https://esm.sh/memfs@4.6.0/lib/print'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import IO from './io/io.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import { assert } from 'std/assert/mod.ts'
import {
  CborUint8Array,
  DispatchFunctions,
  DispatchParams,
  ENTRY_BRANCH,
  ProcessAddress,
  PROCTYPES,
} from './constants.ts'

const log = debug('AI:api')

export default class Artifact {
  #io = IO.create(this)
  get io() {
    return this.#io
  }
  static async create() {
    const artifact = new Artifact()
    await artifact.start()
    return artifact
  }
  async start() {
    await this.#io.start()
  }
  stop() {
    this.#io.stop()
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
    const kv = await openKv()
    log('opened')
    const key = [account, repository, ENTRY_BRANCH]
    const existing = await get(kv, key)
    assert(!existing, 'repo already exists')
    await set(kv, key, uint8)
    log('set')
    kv.close()
    log('closed')
  }
  push(repo: string) {
    throw new Error('not implemented: ' + repo)
  }
  // branch could be a path of keys ?
  dispatch({ pid, isolate, name, parameters, proctype }: DispatchParams) {
    return this.#io.dispatch({ pid, isolate, name, parameters, proctype })
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
    assertPid(pid)
    for (const name of Object.keys(api)) {
      actions[name] = (parameters = {}, proctype = PROCTYPES.SELF) => {
        return this.dispatch({ pid, isolate, name, parameters, proctype })
      }
    }
    log('actions', isolate, Object.keys(actions))
    return actions
  }
  isolateFs(pid: ProcessAddress) {
    // return an instance of artifact that is snapshotted to a specific branch
    // spy the fs so we can trigger updates to be sent down to the client
    return loadSnapshot(pid)
  }
}
const loadSnapshot = async (pid: ProcessAddress) => {
  // TODO maybe break of fs operations into .fs or something
  assertPid(pid)
  const kv = await Deno.openKv()
  const { account, repository, branches } = pid
  const uint8 = await get(kv, [account, repository, ...branches])
  if (!uint8) {
    const repo = `${account}/${repository}`
    throw new Error('repo not found - pull first: ' + repo)
  }
  const snapshotData = uint8 as CborUint8Array<snapshot.SnapshotNode>
  log('reloaded: repo', pretty(uint8.length))
  // TODO cache locally in case we get reused
  kv.close()
  const { fs } = memfs()
  // TODO use unionFs to make layers for each branch
  snapshot.fromBinarySnapshotSync(snapshotData, { fs })
  log('snapshot loaded', toTreeSync(fs))
  return fs
}
const assertPid = (pid: ProcessAddress) => {
  assert(pid.account, 'account is required')
  assert(pid.repository, 'repository is required')
  assert(pid.branches[0], 'branch is required')
  const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
}

const openKv = async () => {
  const KEY = 'DENO_KV_PATH'
  let path = ':memory:'
  const permission = await Deno.permissions.query({
    name: 'env',
    variable: KEY,
  })
  if (permission.state === 'granted') {
    const env = Deno.env.get(KEY)
    if (env) {
      path = env
    }
  }
  log('open kv', path)
  return Deno.openKv(path)
}
