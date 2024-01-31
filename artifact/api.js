import { memfs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import { gunzip, gzip } from 'https://deno.land/x/compress@v0.4.5/mod.ts'
import { PROCTYPES } from './constants.js'
import IO from '@io/io.js'

const log = debug('AI:api')
const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export default class API {
  #io
  static create() {
    // fire up the kv store
    const api = new API()
    api.#io = IO.create()
    return api
  }
  async reload({ repo }) {
    const [account, repository] = repo.split('/')
    if (!githubRegex.test(account) || !githubRegex.test(repository)) {
      throw new Error('Invalid GitHub account or repository name' + repo)
    }
    // acquire lock on the repo in the kv store ?

    const { fs } = memfs()
    const dir = '/' + repo
    fs.mkdirSync('/' + account)
    fs.mkdirSync(dir)
    log('dir', dir)
    const cache = {}
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, cache })
    log('cloned')
    const uint8 = snapshot.toBinarySnapshotSync({ fs, dir: '/repo' })
    log('snapshot', pretty(uint8.length))
    const zip = gzip(uint8, { level: 9 })
    log('zip', pretty(zip.length))

    const db = await Deno.openKv()
    log('opened')
    await db.set(['repo'], zip)
    log('set')
    db.close()
    log('closed')
  }
  // making a new session is just a new action in a known isolate
  async dispatch({ repo, branch, isolate, name, parameters, proctype }) {
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
}
