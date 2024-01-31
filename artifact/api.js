// the file that gets called to trigger functions
const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import git from 'https://esm.sh/isomorphic-git@1.25.3'
import http from 'https://esm.sh/isomorphic-git@1.25.3/http/web'
import { debug } from '$debug'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
const log = debug('AI:api')

export default class API {
  static create() {
    // fire up the kv store
    const api = new API()
    return api
  }
  // repo is [username or organization]/[repository name]
  async reload({ repo }) {
    const [account, repository] = repo.split('/')
    if (!githubRegex.test(account) || !githubRegex.test(repository)) {
      throw new Error('Invalid GitHub account or repository name' + repo)
    }

    // TODO check if we already have some of the repo

    const { fs } = memfs()
    const dir = '/' + repo
    fs.mkdirSync('/' + account)
    fs.mkdirSync(dir)
    const cache = {}
    const url = `https://github.com/${account}/${repository}.git`
    log('start %s', url)
    await git.clone({ fs, http, dir, url, cache })
    const uint8 = snapshot.toBinarySnapshotSync({ fs, dir: '/repo' })
    log('snapshot', pretty(uint8.length))
  }
  // making a new session is just a new action in a known isolate
  async dispatch({ repo, branch, isolate, name, parameters, proctype }) {
  }

  async actions(isolate) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const actions = await this.#actions(isolate, PROCTYPES.SELF)
    return actions
  }
  async spawns(isolate) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const actions = await this.#actions(isolate, PROCTYPES.SPAWN)
    return actions
  }
  async #actions(isolate, proctype) {
    // assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    // assert(PROCTYPES[proctype], `proctype is required: ${proctype}`)
    // debug('actions', isolate)
    // const api = await this.#io.workerApi(isolate)
    // const actions = {}
    // for (const name of Object.keys(api)) {
    //   // TODO make this a lazy proxy that replaces keys each time it is called
    //   actions[name] = async (parameters = {}) => {
    //     return this.#io.dispatch({ isolate, name, parameters, proctype })
    //   }
    //   actions[name].api = api[name]
    // }
    // Object.freeze(actions) // TODO deep freeze
    // debug('actions', isolate, Object.keys(actions))
    // return actions
  }
}
