import posix from 'path-browserify'
import assert from 'assert-fast'
import Debug from 'debug'
const debug = Debug('AI:trigger-fs')
export default class TriggerFS {
  #subscriptions = new Map() // map of paths to sets of callbacks
  #commitSubscriptions = new Map() // map of paths to sets of callbacks
  static create() {
    debug('create')
    const trigger = new TriggerFS()
    return trigger
  }
  subscribe(path, cb, initial) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    assert(path.startsWith('/hal'), `path must start with /hal: ${path}`)
    assert(typeof cb === 'function', `cb must be a function`)
    assert(typeof initial.then === 'function', `initial must be a promise`)

    debug('subscribe', path)
    if (!this.#subscriptions.has(path)) {
      this.#subscriptions.set(path, new Set())
    }
    const callbacks = this.#subscriptions.get(path)
    callbacks.add(cb)

    //TODO if there is already a file, trigger the callback instantly
    initial.then(cb).catch(() => {})

    return () => {
      callbacks.delete(cb)
      if (callbacks.size === 0) {
        this.#subscriptions.delete(path)
      }
    }
  }
  write(path, file) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    assert(path.startsWith('/hal'), `path must start with /hal: ${path}`)
    const callbacks = this.#subscriptions.get(path)
    if (!callbacks) {
      debug('no callbacks for path', path)
      return
    }
    debug('write', path)
    for (const cb of callbacks) {
      cb(file)
    }
  }
  subscribeCommits(repoPath, cb) {
    debug('subscribeCommits', repoPath)
    assert(typeof cb === 'function', `cb must be a function`)
    if (!this.#commitSubscriptions.has(repoPath)) {
      this.#commitSubscriptions.set(repoPath, { callbacks: new Set() })
    }
    const { callbacks, latest } = this.#commitSubscriptions.get(repoPath)
    callbacks.add(cb)
    if (latest) {
      cb(latest)
    }
    return () => {
      callbacks.delete(cb)
      if (callbacks.size === 0) {
        this.#commitSubscriptions.delete(repoPath)
      }
    }
  }
  commit(repoPath, hash) {
    assert(posix.isAbsolute(repoPath), `path must be absolute: ${repoPath}`)
    assert(typeof hash === 'string', `hash must be a string`)
    assert(/^[0-9a-f]{40}$/i.test(hash), `hash must be a SHA1 hash: ${hash}`)

    // for speed, get the root, then subscribe to that
    // then check the path is inside the root, then trigger the callback

    if (!this.#commitSubscriptions.has(repoPath)) {
      this.#commitSubscriptions.set(repoPath, {
        callbacks: new Set(),
        latest: hash,
      })
    }
    const subs = this.#commitSubscriptions.get(repoPath)
    subs.latest = hash
    const { callbacks } = subs
    for (const cb of callbacks) {
      // TODO break the thread here, but preserve call order using iterable
      cb(hash)
    }
  }
}
