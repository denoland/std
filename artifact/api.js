import { toTreeSync } from 'https://esm.sh/memfs@4.6.0/lib/print'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import IO from '@io/io.js'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import { assert } from 'std/assert/mod.ts'
import { PROCTYPES } from './constants.js'

const log = debug('AI:api')
const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export default class API {
  #io
  static create() {
    const api = new API()
    api.#io = IO.create(api)
    return api
  }
  async pull({ repo }) {
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
  }
  async push({ repo }) {
    throw new Error('not implemented')
  }
  // making a new session is just a new action in a known isolate
  async dispatch({ repo, branch, isolate, name, parameters, proctype }) {
    throw new Error('not implemented')
  }
  async isolateApi(isolate) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const api = await this.#io.workerApi(isolate)
    return api
  }
  async inBand(isolate) {
    const inBands = await this.#actions(isolate, PROCTYPES.SELF)
    return inBands
  }
  async spawns(isolate) {
    const spawns = await this.#actions(isolate, PROCTYPES.SPAWN)
    return spawns
  }
  async #actions(isolate, proctype) {
    log('actions for isolate: %s with proctype: %s', isolate, proctype)
    assert(PROCTYPES[proctype], `proctype is required: ${proctype}`)
    const api = await this.isolateApi(isolate)
    const actions = {}
    for (const name of Object.keys(api)) {
      // TODO make this a lazy proxy that replaces keys each time it is called
      actions[name] = (parameters = {}) => {
        // need the repo and the branch to dispatch
        return this.dispatch({ isolate, name, parameters, proctype })
      }
      actions[name].api = api[name]
    }
    Object.freeze(actions) // TODO deep freeze
    log('actions', isolate, Object.keys(actions))
    return actions
  }
  async loadJSON({ repo, branch, path }) {
    const [account, repository] = splitRepo(repo) // test valid string
    assert(!posix.isAbsolute(path), `path must be absolute: ${path}`)
    // TODO figure out the main branch
    branch = branch || 'main'
    const kv = await Deno.openKv()
    const uint8 = await get(kv, [account, repository])
    if (!uint8) {
      throw new Error('repo not found - pull first: ' + repo)
    }
    log('reloaded: repo', pretty(uint8.length))
    // TODO cache locally in case we get reused
    kv.close()
    const { fs } = memfs()
    snapshot.fromBinarySnapshotSync(uint8, { fs })
    log('snapshot loaded', toTreeSync(fs))
    await git.checkout({ fs, dir: '/', ref: branch, filepaths: [path] })
    log('checked out')
    log('checkout tree', toTreeSync(fs))
    const text = fs.readFileSync('/' + path, 'utf8')
    return JSON.parse(text)
  }
}
const splitRepo = (repo) => {
  const [account, repository] = repo.split('/')
  if (!githubRegex.test(account) || !githubRegex.test(repository)) {
    throw new Error('Invalid GitHub account or repository name' + repo)
  }
  return [account, repository]
}
