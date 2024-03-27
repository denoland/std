import { get, set } from '$kv_toolbox'
import { Debug } from '@utils'
import { getRepoRoot } from '@/keys.ts'
import { memfs } from '$memfs'
import type DB from '@/db.ts'
import { assert, equal } from '@utils'
import { PID } from '@/constants.ts'

const log = Debug('AI:git:KV')
const sha1Regex = /^[0-9a-f]{40}$/i

export class GitKV implements Backend {
  #memfs = memfs().fs.promises
  #allowed = ['config', 'objects']
  #dropWrites = ['HEAD']
  #db: DB
  #pid: PID
  constructor(db: DB, pid: PID) {
    this.#db = db
    this.#pid = pid
  }
  async updateTip(commit: string) {
    const tipKey = this.#getTipKey()
    log('updateTip', tipKey, commit)
    assert(sha1Regex.test(commit), 'Commit not SHA-1: ' + commit)
    await this.#db.kv.set(tipKey, commit)
  }
  // if its /.git/HEAD then we intercept it with the PID
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
    const result = await this.#memfs.lstat(path)
    log('lstat', path, result)
    return result
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
    const prefix = getRepoRoot(this.#pid)
    return [...prefix, 'refs', 'heads', ...this.#pid.branches]
  }
}

type EncodingOpts = {
  encoding?: 'utf8'
}

type StatLike = {
  type: 'file' | 'dir' | 'symlink'
  mode: number
  size: number
  ino: number | string | bigint
  mtimeMs: number
  ctimeMs?: number
}
type Backend = {
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
   */
  readFile: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
   */
  writeFile: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
   */
  unlink: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
   */
  readdir: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
   */
  mkdir: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
   */
  rmdir: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
   */
  stat: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
   */
  lstat: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
   */
  readlink?: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
   */
  symlink?: Function
  /**
   * - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
   */
  chmod?: Function
}
class FileNotFoundError extends Error {
  code = 'ENOENT'
  constructor(message: string) {
    super(message)
    this.name = 'FileNotFoundError'
  }
}
