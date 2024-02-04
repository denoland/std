import { toTreeSync } from 'https://esm.sh/memfs@4.6.0/lib/print'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import IO, { DispatchParams } from './io/io.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import { assert } from 'std/assert/mod.ts'
import { CborUint8Array, DispatchFunctions, PROCTYPES } from './constants.ts'

const log = debug('AI:api')
const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export default class Artifact {
  #io = IO.create(this)
  #repo?: string
  #branch?: string
  get io() {
    return this.#io
  }
  static create() {
    const artifact = new Artifact()
    return artifact
  }
  async start() {
    await this.#io.start()
  }
  stop() {
    this.#io.stop()
  }
  async pull(repo: string) {
    const [account, repository] = splitRepo(repo)
    // TODO acquire lock on the repo in the kv store ?

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, noCheckout: true })
    log('cloned')
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('snapshot', pretty(uint8.length))
    const kv = await Deno.openKv()
    log('opened')
    await set(kv, [account, repository], uint8)
    log('set')
    kv.close()
    log('closed')
    this.#repo = repo
    this.#branch = 'main'
  }
  push(repo: string) {
    throw new Error('not implemented: ' + repo)
  }
  // branch could be a path of keys ?
  dispatch({ repo, branch, args }: DispatchParams) {
    return this.#io.dispatch({ repo, branch, args })
  }
  async isolateApi(isolate: string) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const api = await this.#io.workerApi(isolate)
    return api
  }
  async inBands(isolate: string) {
    const inBands = await this.#actions(isolate, PROCTYPES.SELF)
    return inBands
  }
  async spawns(isolate: string) {
    const spawns = await this.#actions(isolate, PROCTYPES.SPAWN)
    return spawns
  }
  async #actions(isolate: string, proctype: PROCTYPES) {
    // sniff the current repo and branch out ?
    log('actions for isolate: %s with proctype: %s', isolate, proctype)
    assert(PROCTYPES[proctype], `proctype is required: ${proctype}`)
    const api = await this.isolateApi(isolate)
    const actions: DispatchFunctions = {}
    // should artifact be always scoped to an fs snapshot ?
    // should the branch be set at create time ?
    // so pull is really a starter function that creates the api ?
    // or spawn should be a wrapper around a specific dispatch ?
    // or produce both types together, with different functions ?
    const repo = this.#repo
    const branch = this.#branch
    assert(repo && branch, 'repo and branch must be set')
    // branch address could be anything tho ?
    for (const name of Object.keys(api)) {
      actions[name] = (parameters = {}) => {
        const args = { isolate, name, parameters, proctype }
        return this.dispatch({ repo, branch, args })
      }
    }
    log('actions', isolate, Object.keys(actions))
    return actions
  }
  snapshot(repo: string, branch: string) {
    // return an instance of artifact that is snapshotted to a specific branch
    // spy the fs so we can trigger updates to be sent down to the client
    return loadSnapshot(repo, branch)
  }
}
const splitRepo = (repo: string) => {
  const [account, repository] = repo.split('/')
  if (!githubRegex.test(account) || !githubRegex.test(repository)) {
    throw new Error('Invalid GitHub account or repository name' + repo)
  }
  return [account, repository]
}
const loadSnapshot = async (repo: string, branch: string) => {
  // TODO store a path to the branch back to root, so each branch only stores
  // its layered filesystem
  // maybe break of fs operations into .fs or something
  // account of the caller is implied by the token
  const [account, repository] = splitRepo(repo) // test valid string
  const kv = await Deno.openKv()
  const uint8 = await get(kv, [account, repository, branch])
  if (!uint8) {
    throw new Error('repo not found - pull first: ' + repo)
  }
  const snapshotData = uint8 as CborUint8Array<snapshot.SnapshotNode>
  log('reloaded: repo', pretty(uint8.length))
  // TODO cache locally in case we get reused
  kv.close()
  const { fs } = memfs()
  snapshot.fromBinarySnapshotSync(snapshotData, { fs })
  log('snapshot loaded', toTreeSync(fs))
  return fs
}
