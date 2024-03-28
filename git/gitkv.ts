import { get, set } from '$kv_toolbox'
import { Debug } from '@utils'
import { getRepoRoot } from '@/keys.ts'
import type DB from '@/db.ts'
import { assert, equal } from '@utils'
import { PID } from '@/constants.ts'

const log = Debug('AI:git:KV')
const sha1Regex = /^[0-9a-f]{40}$/i

export class GitKV {
  #allowed = ['config', 'objects']
  #dropWrites = ['HEAD']
  #db: DB
  #pid: PID
  constructor(db: DB, pid: PID) {
    this.#db = db
    this.#pid = pid
  }
  async updateHead(commit: string) {
    const tipKey = this.#getTipKey()
    log('updateTip', tipKey, commit)
    assert(sha1Regex.test(commit), 'Commit not SHA-1: ' + commit)
    await this.#db.kv.set(tipKey, commit)
  }
  async createBranch(name: string, commit: string) {
    log('createBranch', name)
    const branches = [...this.#pid.branches, name]
    const pid = { ...this.#pid, branches }
    const key = getTipKey(pid)
    const result = await this.#db.kv.atomic().check({ key, versionstamp: null })
      .set(key, commit).commit()
    if (!result.ok) {
      throw new Error('branch already exists: ' + key.join('/'))
    }
    return pid
  }
  async deleteBranch(name: string) {
    log('deleteBranch', name)
    const branches = [...this.#pid.branches, name]
    const pid = { ...this.#pid, branches }
    const key = getTipKey(pid)
    const current = await this.#db.kv.get(key)
    assert(current.versionstamp, 'branch not found: ' + key.join('/'))
    const result = await this.#db.kv.atomic().check(current)
      .delete(key).commit()
    if (!result.ok) {
      throw new Error('branch already deleted: ' + key.join('/'))
    }
  }
  async readHead() {
    const tipKey = this.#getTipKey()
    const result = await this.#db.kv.get<string>(tipKey)
    assert(result.versionstamp, 'tip not found')
    return result.value
  }
  async readFile(path: string, opts: EncodingOpts) {
    log('readFile', path, opts)
    if (!path && !opts) {
      throw new Error('path and opts are required')
    }
    // if this was a request to HEAD, we need to switch it out
    if (path === '/.git/HEAD') {
      let ref = `ref: refs/heads`
      for (const branch of this.#pid.branches) {
        ref += `/${branch}`
      }
      log('readFile HEAD ref', ref)
      return ref
    }
    if (path.startsWith('/.git/refs/heads/')) {
      // assert that the rest of the path matches the pid branches array
      const rest = path.slice('/.git/refs/heads/'.length)
      const branches = rest.split('/')
      log('readFile refs/heads:', branches)
      assert(equal(branches, this.#pid.branches), 'branches do not match')
      const tipKey = this.#getTipKey()
      const result = await this.#db.kv.get(tipKey)
      assert(result.versionstamp, 'tip not found: ' + path)
      return result.value
    }

    const pathKey = this.#getAllowedPathKey(path)
    const result = await get(this.#db.kv, pathKey)

    if (!result) {
      log('readFile not found', path, opts)
      throw new FileNotFoundError('file not found: ' + path)
    }
    if (opts && opts.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }
    if (opts && opts.encoding === 'utf8') {
      const string = new TextDecoder().decode(result)
      log('readFile', path, opts, string)
      return string
    }
    log('readFile', path, opts, typeof result, result.byteLength)
    return result
    // const result = await this.#memfs.readFile(path, opts)
    // log('readFile', path, opts, result)

    // return result
  }
  isIgnored(path: string) {
    const sliced = path.slice('/.git/'.length)
    return this.#dropWrites.includes(sliced)
  }
  async writeFile(
    path: string,
    data: ArrayBufferLike | string,
    opts: EncodingOpts,
  ) {
    log('writeFile', path, opts)
    if (opts && opts.encoding && opts.encoding !== 'utf8') {
      throw new Error('only utf8 encoding is supported')
    }
    if (this.isIgnored(path)) {
      log('writeFile ignored', path)
      return
    }
    const pathKey = this.#getAllowedPathKey(path)

    if (typeof data === 'string') {
      data = new TextEncoder().encode(data)
    }

    await set(this.#db.kv, pathKey, data)
    log('writeFile done')
  }
  async unlink(path: string) {
    log('unlink', path)
    return await Promise.reject(new Error('not implemented'))
  }
  async readdir(path: string) {
    log('readdir', path)
    return await Promise.reject(new Error('not implemented'))
  }
  mkdir(path: string) {
    log('mkdir', path)
    return Promise.resolve()
    // const result = await this.#memfs.mkdir(path)
    // log('mkdir', path, result)
    // return result
  }
  async rmdir(path: string) {
    log('rmdir', path)
    return await Promise.reject(new Error('not implemented'))
  }
  async stat(path: string) {
    log('stat', path)
    // generate the key for the path
    const pathKey = this.#getAllowedPathKey(path)
    // no need to fetch the whole blob
    const result = await this.#db.kv.get(pathKey)
    if (!result.versionstamp) {
      throw new FileNotFoundError('file not found: ' + path)
    }
    // TODO make this be statlike
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
    this.#assertAllowed(pathKey)

    return [...prefix, ...pathKey]
  }
  #assertAllowed(pathKey: string[]) {
    assert(this.#allowed.includes(pathKey[0]), 'path not allowed: ' + pathKey)
  }
  #getTipKey() {
    return getTipKey(this.#pid)
  }
}
const getTipKey = (pid: PID) => {
  const prefix = getRepoRoot(pid)
  return [...prefix, 'refs', 'heads', ...pid.branches]
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
