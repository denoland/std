import { Debug } from '@utils'
import { getRepoBase, headKeyToPid } from '@/keys.ts'
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
  #exists: Set<string> | undefined
  #cache = Cache.create()

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
    if (this.#exists && !this.#exists.has(path)) {
      throw new FileNotFoundError('file not found: ' + path)
    }
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

    const pathKey = this.#getAllowedPathKey(path)
    let result: Uint8Array
    if (await this.#cache.has(pathKey)) {
      const cached = await this.#cache.get(pathKey)
      assert(cached, 'cache fail')
      result = cached
    } else {
      const dbResult = await this.#db.blobGet(pathKey)

      if (!dbResult.versionstamp) {
        log('readFile not found', path, opts)
        throw new FileNotFoundError('file not found: ' + path)
      }
      result = dbResult.value
      await this.#cache.set(pathKey, result)
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
    if (this.#exists) {
      this.#exists.add(path)
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
      await this.#cache.set(pathKey, data)
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
    let pathKey = getRepoBase(this.#pid)
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
          // wastes a round trip to the db otherwise
          throw new FileNotFoundError('file not found: ' + path)
        }
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
    const prefix = getRepoBase(this.#pid)
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
class Cache {
  static create() {
    return new Cache()
  }
  static #local = new Map<string, Uint8Array>()
  #big: globalThis.Cache | undefined
  async #load() {
    if ('caches' in globalThis && !this.#big) {
      this.#big = await caches.open('hashbucket')
    }
  }
  async has(key: Deno.KvKey) {
    const url = toUrl(key)
    if (Cache.#local.has(url)) {
      return true
    }

    await this.#load()
    if (this.#big) {
      const result = await this.#big.match(url)
      result?.body?.cancel()
      return !!result
    }
  }
  async get(key: Deno.KvKey) {
    const url = toUrl(key)
    if (Cache.#local.has(url)) {
      return Cache.#local.get(url)
    }
    await this.#load()
    if (this.#big) {
      const cached = await this.#big.match(url)
      if (cached) {
        const ab = await cached.arrayBuffer()
        return new Uint8Array(ab)
      }
    }
    throw new Error('not found: ' + key.join('/'))
  }
  async set(key: Deno.KvKey, value: Uint8Array) {
    await this.#load()
    const url = toUrl(key)
    Cache.#local.set(url, value)
    if (this.#big) {
      const request = new Request(url)
      await this.#big.put(request, new Response(value))
    }
  }
}
const toUrl = (pathKey: Deno.KvKey) => 'http://' + pathKey.join('/')
