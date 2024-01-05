import posix from 'path-browserify'
import assert from 'assert-fast'

export default class TriggerFS {
  #subscriptions = new Map() // map of paths to sets of callbacks
  #commitSubscriptions = new Map() // map of paths to sets of callbacks
  static create() {
    const trigger = new TriggerFS()
    return trigger
  }
  subscribe(path, cb, initial) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    assert(typeof cb === 'function', `cb must be a function`)
    assert(typeof initial.then === 'function', `initial must be a promise`)

    if (!this.#subscriptions.has(path)) {
      this.#subscriptions.set(path, new Set())
    }
    const callbacks = this.#subscriptions.get(path)
    callbacks.add(cb)

    //TODO if there is already a file, trigger the callback instantly
    initial
      .catch((e) => {
        console.error(e)
      })
      .then(cb)

    return () => {
      callbacks.delete(cb)
      if (callbacks.size === 0) {
        this.#subscriptions.delete(path)
      }
    }
  }
  write(path, file) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const callbacks = this.#subscriptions.get(path)
    if (!callbacks) {
      return
    }
    for (const cb of callbacks) {
      cb(file)
    }
  }
  subscribeCommits(path, cb) {
    // TODO handle pathing in commits
    assert(typeof cb === 'function', `cb must be a function`)
    if (!this.#commitSubscriptions.has(path)) {
      this.#commitSubscriptions.set(path, new Set())
    }
    const callbacks = this.#commitSubscriptions.get(path)
    callbacks.add(cb)
    return () => {
      callbacks.delete(cb)
      if (callbacks.size === 0) {
        this.#commitSubscriptions.delete(path)
      }
    }
  }
  commit(path) {
    // TODO handle pathing in commits
    if (!this.#commitSubscriptions.has(path)) {
      this.#commitSubscriptions.set(path, new Set())
    }
    const callbacks = this.#commitSubscriptions.get(path)
    for (const cb of callbacks) {
      cb()
    }
  }
}
