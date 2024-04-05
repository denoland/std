import { Debug } from '@utils'
import { getRepoRoot, headKeyToPid } from '@/keys.ts'
import type DB from '@/db.ts'
import { assert, AssertionError, equal } from '@utils'
import { PID } from '@/constants.ts'
import { Atomic } from '@/atomic.ts'

const log = Debug('AI:git:KV')

export class GitKV {
  #allowed = ['config', 'objects', 'refs']
  #dropWrites = ['HEAD']
  #db: DB
  #pid: PID
  static #cache = new Map<string, Uint8Array>()
  private constructor(db: DB, pid: PID) {
    this.#db = db
    this.#pid = pid
  }
  static create(db: DB, pid: PID) {
    return new GitKV(db, pid)
  }
  isIgnored(path: string) {
    const sliced = path.slice('/.git/'.length)
    return this.#dropWrites.includes(sliced)
  }
  async readFile(path: string, opts: EncodingOpts) {
    log('readFile', path, opts)
    if (!path && !opts) {
      throw new Error('path and opts are required')
    }
    if (path === '/.git/HEAD') {
      let ref = `ref: refs/heads`
      for (const branch of this.#pid.branches) {
        ref += `/${branch}`
      }
      log('readFile HEAD ref', ref)
      return ref
    }
    if (path.startsWith('/.git/refs/heads/')) {
      // only allow reading heads from the current branch, else what doing ?
      const rest = path.slice('/.git/refs/heads/'.length)
      const branches = rest.split('/')
      log('readFile refs/heads:', branches)
      assert(equal(branches, this.#pid.branches), 'branches do not match')
      const head = this.#db.readHead(this.#pid)
      if (!head) {
        throw new FileNotFoundError('file not found: ' + path)
      }
      return head
    }

    const pathKey = this.#getAllowedPathKey(path)
    let result: Uint8Array
    if (GitKV.#cache.has(pathKey.join('/'))) {
      const cached = GitKV.#cache.get(pathKey.join('/'))
      assert(cached)
      result = cached
    } else {
      const dbResult = await this.#db.blobGet(pathKey)

      if (!dbResult.versionstamp) {
        log('readFile not found', path, opts)
        throw new FileNotFoundError('file not found: ' + path)
      }
      result = dbResult.value
    }
    if (opts && opts.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }
    if (opts && opts.encoding === 'utf8') {
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
    opts: EncodingOpts,
  ) {
    log('writeFile', path, data, opts)
    if (opts && opts.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }
    if (this.isIgnored(path)) {
      log('writeFile ignored', path)
      return
    }
    const pathKey = this.#getAllowedPathKey(path)

    // TODO skip the remote HEAD writes too ?
    if (path.startsWith('/.git/refs/heads/')) {
      // TODO use the head tool on this.#db to ensure consistency
      assert(typeof data === 'string', 'data must be a string')
      const pid = headKeyToPid(pathKey)
      // TODO ensure have maintenance while this is being changed
      assert(this.#oneAtomicWrite, 'no atomic write provided')
      const atomic = this.#oneAtomicWrite
      this.#oneAtomicWrite = undefined
      await atomic.createBranch(pid, data.trim()).commit()
    } else {
      if (typeof data === 'string') {
        data = new TextEncoder().encode(data)
      }
      GitKV.#cache.set(pathKey.join('/'), data)
      await this.#db.blobSet(pathKey, data)
    }
    log('writeFile done:', pathKey)
  }
  #oneAtomicWrite: Atomic | undefined
  set oneAtomicWrite(atomic: Atomic) {
    this.#oneAtomicWrite = atomic
  }
  async unlink(path: string) {
    log('unlink', path)
    if (path === '/.git/shallow') {
      return
    }
    return await Promise.reject(new Error('not implemented'))
  }
  async readdir(path: string, options?: object) {
    log('readdir', path)
    assert(!options, 'options not supported')
    let pathKey = getRepoRoot(this.#pid)
    if (path !== '/.git') {
      pathKey = this.#getAllowedPathKey(path)
    }
    const results = await this.#db.listImmediateChildren(pathKey)
    log('readdir', path, results)

    return results
  }
  mkdir(path: string) {
    log('mkdir', path)
    return Promise.resolve()
  }
  async rmdir(path: string) {
    log('rmdir', path)
    return await Promise.reject(new Error('not implemented'))
  }
  async stat(path: string) {
    log('stat', path)
    // generate the key for the path
    let pathKey
    try {
      pathKey = this.#getAllowedPathKey(path)
    } catch (error) {
      if (error instanceof AssertionError) {
        throw new FileNotFoundError('file not found: ' + path)
      }
      throw error
    }
    log('stat pathKey', pathKey)
    let exists = false
    if (path.startsWith('/.git/refs/heads/')) {
      const pid = headKeyToPid(pathKey)
      const head = await this.#db.readHead(pid)
      exists = !!head
    } else {
      if (GitKV.#cache.has(pathKey.join('/'))) {
        exists = true
      } else {
        // TODO no need to fetch the whole blob
        exists = await this.#db.blobExists(pathKey)
      }
    }
    if (!exists) {
      throw new FileNotFoundError('file not found: ' + path)
    }
    return {}
  }
  async lstat(path: string) {
    log('lstat', path)
    const message = 'not implemented: ' + path
    return await Promise.reject(new FileNotFoundError(message))
  }
  async readlink(path: string) {
    log('readlink', path)
    return await Promise.reject(new Error('not implemented'))
  }
  async symlink(target: string, path: string, type: string) {
    log('symlink', target, path, type)
    return await Promise.reject(new Error('not implemented'))
  }
  async chmod(path: string, mode: number) {
    log('chmod', path, mode)
    return await Promise.reject(new Error('not implemented'))
  }
  #getAllowedPathKey(path: string) {
    assert(path.startsWith('/.git/'), 'path must start with /.git/')
    const rest = path.slice('/.git/'.length)
    assert(rest, 'path must not be bare')
    const prefix = getRepoRoot(this.#pid)
    const pathKey = rest.split('/')
    assert(this.#allowed.includes(pathKey[0]), 'path not allowed: ' + pathKey)

    return [...prefix, ...pathKey]
  }
}

type EncodingOpts = {
  encoding?: 'utf8'
}

class FileNotFoundError extends Error {
  code = 'ENOENT'
  constructor(message: string) {
    super(message)
    this.name = 'FileNotFoundError'
  }
}
