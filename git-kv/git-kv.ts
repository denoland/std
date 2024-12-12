import Debug from 'debug'
import { getRepoBase, headKeyToPid } from '../engine/keys.ts'
import type DB from '../engine/db.ts'
import { assert, AssertionError } from '@std/assert'
import equal from 'fast-deep-equal'

import type { PID } from '../processes/processes.ts'
import type { Atomic } from '../engine/atomic.ts'
import { FileNotFoundError } from './errors.ts'
import { Cache } from './cache.ts'

const log = Debug('git:KV')

type EncodingOpts = {
  encoding?: 'utf8'
}

export class GitKV {
  #allowed = ['config', 'objects', 'refs']
  #dropWrites = ['HEAD']
  #db: DB
  #pid: PID
  #exists: Set<string> | undefined
  #cache = Cache.create()
  #oneAtomicWrite: Atomic | undefined

  private constructor(db: DB, pid: PID, isBlank: boolean = false) {
    this.#db = db
    this.#pid = pid
    if (isBlank) {
      this.#exists = new Set()
    }
  }

  static recreate(db: DB, pid: PID) {
    return new GitKV(db, pid)
  }

  static createBlank(db: DB, pid: PID) {
    const isBlankDuringInitAndClone = true
    return new GitKV(db, pid, isBlankDuringInitAndClone)
  }

  set oneAtomicWrite(atomic: Atomic) {
    this.#oneAtomicWrite = atomic
  }

  isIgnored(path: string): boolean {
    if (!path.startsWith('/.git/')) return false
    const sliced = path.slice('/.git/'.length)
    return this.#dropWrites.includes(sliced)
  }

  async readFile(
    path: string,
    opts?: EncodingOpts,
  ): Promise<string | Uint8Array> {
    log('readFile', path, opts)
    if (!path) {
      throw new Error('path is required')
    }

    // Disallow reading the Git index file as per the spec (no Git index)
    if (path === '/.git/index') {
      throw new FileNotFoundError('file not found: ' + path)
    }

    // Emulate a HEAD that points to refs/heads/<branch>... according to PID
    if (path === '/.git/HEAD') {
      // Construct a HEAD ref line
      // If multiple branches are present in this PID context, this might need clarification.
      let ref = 'ref: refs/heads'
      for (const branch of this.#pid.branches) {
        ref += `/${branch}`
      }
      log('readFile HEAD ref', ref)
      return ref
    }

    if (this.#exists && !this.#exists.has(path)) {
      throw new FileNotFoundError('file not found: ' + path)
    }

    // Reading refs/heads/... ensures that we are reading the current branch head
    if (path.startsWith('/.git/refs/heads/')) {
      // only allow reading heads from the current branch, else what doing ?
      const rest = path.slice('/.git/refs/heads/'.length)
      const branches = rest.split('/')
      log('readFile refs/heads:', branches)
      assert(equal(branches, this.#pid.branches), 'branches do not match')
      const head = await this.#db.readHead(this.#pid)
      if (!head) {
        throw new FileNotFoundError('file not found: ' + path)
      }
      return head
    }

    if (opts?.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }

    const pathKey = this.#getAllowedPathKey(path)
    let result: Uint8Array
    if (await this.#cache.has(pathKey)) {
      result = this.#cache.get(pathKey)
    } else {
      const dbResult = await this.#db.blobGet(pathKey)
      if (!dbResult.versionstamp) {
        log('readFile not found', path, opts)
        throw new FileNotFoundError('file not found: ' + path)
      }
      result = dbResult.value
      await this.#cache.set(pathKey, result)
    }

    if (opts?.encoding === 'utf8') {
      const string = new TextDecoder().decode(result)
      log('readFile', path, opts, string)
      return string
    }
    log('readFile', path, opts, typeof result)
    return result
  }

  async writeFile(
    path: string,
    data: Uint8Array | string,
    opts?: EncodingOpts,
  ): Promise<void> {
    log('writeFile', path, data, opts)
    if (opts?.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }

    // Ignore writes to HEAD as per the spec (no single HEAD pointer)
    if (this.isIgnored(path)) {
      log('writeFile ignored', path)
      return
    }

    // No Git index file manipulation
    if (path === '/.git/index') {
      throw new Error('will not write to index')
    }

    if (this.#exists) {
      this.#exists.add(path)
    }

    const pathKey = this.#getAllowedPathKey(path)

    // TODO skip the remote HEAD writes too ?
    // For refs, we assume atomic reference updates
    if (path.startsWith('/.git/refs/heads/')) {
      // TODO use the head tool on this.#db to ensure consistency
      assert(typeof data === 'string', 'data must be a string for refs')
      const pid = headKeyToPid(pathKey)
      // TODO ensure have maintenance while this is being changed
      assert(this.#oneAtomicWrite, 'no atomic write provided for ref update')
      const atomic = this.#oneAtomicWrite
      this.#oneAtomicWrite = undefined
      await atomic.createBranch(pid, data.trim()).commit()
    } else {
      if (typeof data === 'string') {
        data = new TextEncoder().encode(data)
      }
      const promise = this.#cache.set(pathKey, data)
      await this.#db.blobSet(pathKey, data)
      await promise
    }
    log('writeFile done:', pathKey)
  }

  async unlink(path: string): Promise<void> {
    log('unlink', path)
    if (path === '/.git/shallow') {
      // It's allowed to unlink shallow without error as per git usage
      return
    }
    return await Promise.reject(new Error('not implemented'))
  }

  async readdir(path: string, options?: object): Promise<string[]> {
    log('readdir', path)
    assert(!options, 'options not supported')
    let pathKey = getRepoBase(this.#pid)
    if (path !== '/.git') {
      pathKey = this.#getAllowedPathKey(path)
    }
    const results = await this.#db.listImmediateChildren(pathKey)
    log('readdir', path, results)
    return results
  }

  mkdir(path: string): Promise<void> {
    log('mkdir', path)
    // Directories are a no-op in a KV store
    return Promise.resolve()
  }

  async rmdir(path: string): Promise<void> {
    log('rmdir', path)
    return await Promise.reject(new Error('not implemented'))
  }

  async stat(path: string): Promise<Record<string, unknown>> {
    log('stat', path)
    let pathKey
    try {
      pathKey = this.#getAllowedPathKey(path)
    } catch (error) {
      if (error instanceof AssertionError) {
        throw new FileNotFoundError('file not found: ' + path)
      }
      throw error
    }

    if (this.#exists && !this.#exists.has(path)) {
      throw new FileNotFoundError('file not found: ' + path)
    }

    log('stat pathKey', pathKey)
    let exists = false
    if (path.startsWith('/.git/refs/heads/')) {
      const pid = headKeyToPid(pathKey)
      const head = await this.#db.readHead(pid)
      exists = !!head
    } else {
      if (await this.#cache.has(pathKey)) {
        exists = true
      } else {
        if (path.startsWith('/.git/objects/')) {
          // Directly throwing not found here to save a DB roundtrip
          throw new FileNotFoundError('file not found: ' + path)
        }
        exists = await this.#db.blobExists(pathKey)
      }
    }

    if (!exists) {
      throw new FileNotFoundError('file not found: ' + path)
    }

    // Return a minimal stat object
    return {}
  }

  async lstat(path: string): Promise<never> {
    log('lstat', path)
    const message = 'not implemented: ' + path
    return await Promise.reject(new FileNotFoundError(message))
  }

  async readlink(path: string): Promise<never> {
    log('readlink', path)
    return await Promise.reject(new Error('not implemented'))
  }

  async symlink(target: string, path: string, type: string): Promise<never> {
    log('symlink', target, path, type)
    return await Promise.reject(new Error('not implemented'))
  }

  async chmod(path: string, mode: number): Promise<never> {
    log('chmod', path, mode)
    return await Promise.reject(new Error('not implemented'))
  }

  #getAllowedPathKey(path: string): string[] {
    assert(path.startsWith('/.git/'), 'path must start with /.git/')
    const rest = path.slice('/.git/'.length)
    assert(rest, 'path must not be bare')
    const prefix = getRepoBase(this.#pid)
    const pathKey = rest.split('/')
    assert(pathKey[0], 'path must have a first key')
    assert(this.#allowed.includes(pathKey[0]), 'path not allowed: ' + pathKey)

    return [...prefix, ...pathKey]
  }
}
