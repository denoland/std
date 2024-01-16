import IO, { PROCTYPES, defaultBranch } from './io.js'
import posix from 'path-browserify'
import git from 'isomorphic-git'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import assert from 'assert-fast'
import TriggerFS from './trigger-fs.js'
import Debug from 'debug'
const debug = Debug('AI:artifact')
globalThis.Buffer = Buffer

export default class Artifact {
  #fs
  #dir
  #cache
  #opts
  #trigger
  #io
  static async boot({ path = 'fs', wipe = false } = {}) {
    const artifact = new Artifact()
    artifact.#trigger = TriggerFS.create()
    artifact.#fs = new LightningFS(path, { wipe }).promises
    artifact.#dir = '/hal'
    artifact.#cache = {}
    artifact.#opts = {
      fs: artifact.#fs,
      dir: artifact.#dir,
      cache: artifact.#cache,
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
    await git.init({ ...this.#opts, defaultBranch })
    await this.#fs.mkdir(this.#dir + '/helps')
    const helps = ['goalie', 'help.fixture', 'curtains']
    await Promise.all(
      helps.map(async (slug) => {
        const name = '/helps/' + slug + '.js'
        const file = await import(`../helps/${slug}.js?raw`)
        await this.#fs.writeFile(this.#dir + name, file.default)
      })
    )
    debug('filesystem created')
    await this.#commitAll({ message: 'init', author: { name: 'HAL' } })
  }
  async read(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const contents = await this.#fs.readFile(this.#dir + path, 'utf8')
    return contents
  }
  async delete(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    await this.#fs.unlink(this.#dir + path)
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
    const actions = await this.#dispatch(isolate, PROCTYPES.SELF)
    return actions
  }
  async spawns(isolate) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    const actions = await this.#dispatch(isolate, PROCTYPES.SPAWN)
    return actions
  }
  async #dispatch(isolate, proctype) {
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
    }
    Object.freeze(actions)
    debug('actions', isolate, Object.keys(actions))
    return actions
  }
  async writeCommit(path, file, message) {
    debug('writeCommit', path, message)
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = posix.normalize(this.#dir + path)
    const filepath = posix.relative(this.#dir, absolute)
    await this.#fs.writeFile(absolute, file)
    this.#trigger.write(absolute, file)
    await git.add({ ...this.#opts, filepath })
    await this.#commit({ message, author: { name: 'HAL' } })
  }
  async #commitAll({ message, author }) {
    // TODO confirm this adds all files
    await git.add({ ...this.#opts, filepath: '.' })
    await this.#commit({ message, author })
  }
  async #commit({ message, author }) {
    // TODO check commit not empty
    const hash = await git.commit({ ...this.#opts, message, author })
    this.#trigger.commit(this.#dir, hash)
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
