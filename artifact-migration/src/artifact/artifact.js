import './shim.js'
import { isBrowser } from 'wherearewe'
import http from 'isomorphic-git/http/web'
import IO, { defaultBranch, PROCTYPES } from '../../../artifact/io/io.js'
import posix from 'path-browserify'
import git from 'isomorphic-git'
import LightningFS from '@isomorphic-git/lightning-fs'
import assert from 'assert-fast'
import TriggerFS from './trigger-fs.js'
import Debug from 'debug'

const debug = Debug('AI:artifact')

export default class Artifact {
  #fs
  #dir
  #cache
  #opts
  #trigger
  #io
  // TODO if we are booting from HAL, then store a cached zip file locally
  static async boot({ path = 'fs', wipe = true } = {}) {
    // TODO if an existing artifact, boot using a layered fs for instant boot
    // then pass the top level lock to the next one in the queue
    const artifact = new Artifact()
    artifact.#trigger = TriggerFS.create()
    artifact.#fs = new LightningFS(path, { wipe }).promises
    artifact.#dir = '/hal'
    artifact.#cache = {}
    artifact.#opts = {
      fs: artifact.#fs,
      dir: artifact.#dir,
      cache: artifact.#cache,
      http,
    }
    if (isBrowser) {
      // artifact.#opts.corsProxy = 'https://artifact-git-cors-proxy.deno.dev'
      artifact.#opts.corsProxy = 'https://cors.isomorphic-git.org'
    }
    const opts = { ...artifact.#opts, trigger: artifact.#trigger }
    artifact.#io = IO.create({ artifact, opts })
    await artifact.#load()
    await artifact.#io.start()
    return artifact
  }
  async stop() {
    await this.#io.stop()
  }
  async #load() {
    debug('checking repo')
    let isGitPresent = false
    try {
      const filepath = this.#dir
      const gitRoot = await git.findRoot({ ...this.#opts, filepath })
      debug('gitRoot', gitRoot)
      isGitPresent = true
    } catch (e) {
      isGitPresent = false
    }
    if (!isGitPresent) {
      await this.#init()
    }
    // TODO walk for IO changes with no ooutputs and load them
    // TODO add an emergency exit key sequence to default the pipe
  }
  async #init() {
    debug('creating repo')
    await this.#fs.mkdir(this.#dir).catch((e) => {
      if (!e.message.startsWith('EEXIST')) {
        throw e
      }
    })

    // TODO hook in the status to some loading bar thing
    await git.clone({
      ...this.#opts,
      url: 'https://github.com/dreamcatcher-tech/HAL.git',
    })
    debug('filesystem cloned')
    // TODO trigger a commit to cause action processing to begin
    // await this.#trigger.commit(this.#dir, ref)
  }
  async read(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const contents = await this.#fs.readFile(this.#dir + path, 'utf8')
    return contents
  }
  async readIO() {
    // TODO specify a branch and possibly a historical commit to read from
    return await this.#io.readIO()
  }
  async rm(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    try {
      await this.#fs.unlink(this.#dir + path)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }
  async log({ filepath = '/', depth }) {
    filepath = filepath === '/' ? '/hal' : posix.resolve('/hal', filepath)
    const repoPath = await git.findRoot({ ...this.#opts, filepath })
    assert(repoPath, `repoPath not found: ${filepath}`)
    const relative = posix.relative(repoPath, filepath) //?
    return await git.log({ ...this.#opts, filepath: relative, depth })
  }
  subscribe(path, cb) {
    // TODO cache the results for a path
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = this.#dir + path
    const initial = this.#fs.readFile(absolute, 'utf8')
    return this.#trigger.subscribe(absolute, cb, initial)
  }
  // TODO ensure subscriptions await the callback in a queue
  // so implementations can be asured they get called in sequence
  async subscribeCommits(filepath, cb) {
    // TODO cache the results
    // TODO do an initial load up so the subscriber starts with the latest one
    // TODO root vs file should be different function calls
    // async since needs to find the nearest repo root
    assert(posix.isAbsolute(filepath), `filepath must be absolute: ${filepath}`)
    filepath = filepath === '/' ? '' : filepath
    filepath = posix.normalize('/hal' + filepath)
    const repoPath = await git.findRoot({ ...this.#opts, filepath })
    assert(repoPath, `repoPath not found: ${filepath}`)
    // TODO order the async git functions using an async iterable
    if (repoPath === filepath) {
      return this.#trigger.subscribeCommits(repoPath, cb)
    }
    const relative = posix.relative(repoPath, filepath)
    return this.#trigger.subscribeCommits(repoPath, async () => {
      // TODO move to using a walker with the hash

      const commit = await git.log({
        ...this.#opts,
        depth: 1,
        filepath: relative,
        force: true,
      })
      if (!commit.length) {
        return
      }
      // TODO ensure the worktree is the actual unfettered item
      // TODO handle directories ?
      const file = await this.#fs.readFile(filepath, 'utf8')
      cb(file)
    })
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
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    assert(PROCTYPES[proctype], `proctype is required: ${proctype}`)
    debug('actions', isolate)
    const api = await this.#io.workerApi(isolate)
    const actions = {}
    for (const name of Object.keys(api)) {
      // TODO make this a lazy proxy that replaces keys each time it is called
      actions[name] = async (parameters = {}) => {
        return this.#io.dispatch({ isolate, name, parameters, proctype })
      }
      actions[name].api = api[name]
    }
    Object.freeze(actions) // TODO deep freeze
    debug('actions', isolate, Object.keys(actions))
    return actions
  }
  async writeCommit(path, file, message) {
    debug('writeCommit', path, message)
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = posix.normalize(this.#dir + path)
    const filepath = posix.relative(this.#dir, absolute)
    await this.#fs.writeFile(absolute, file)
    await this.#trigger.write(absolute, file)
    await git.add({ ...this.#opts, filepath })
    await this.#commit({ message, author: { name: 'HAL' } })
  }
  async ls(path = '/') {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = posix.normalize(this.#dir + path)
    const files = await this.#fs.readdir(absolute)
    return files
  }
  async #commit({ message, author }) {
    // TODO check commit not empty
    const hash = await git.commit({ ...this.#opts, message, author })
    await this.#trigger.commit(this.#dir, hash)
  }
  async write(path, file) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = posix.normalize(this.#dir + path)
    await this.#fs.writeFile(absolute, file)
    this.#trigger.write(absolute, file)
  }
  async stat(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = posix.normalize(this.#dir + path)
    return await this.#fs.stat(absolute)
  }
}
