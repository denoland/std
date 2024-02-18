import Compartment from './io/compartment.ts'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { Debug } from '@utils'
import git from '$git'

const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
export default class IsolateApi<T extends object = Default> {
  #fs!: IFs
  // TODO assign a mount id for each side effect trail
  #context: Partial<T> = {}
  static create(fs?: IFs) {
    const api = new IsolateApi()
    if (!fs) {
      fs = memfs().fs
    }
    api.#fs = fs
    return api
  }
  /**
   * When any of these functions are called, they will be executed in the same
   * branch is the caller, and will be executed in the order they were called.
   * A call to this function will cause two commits to occur on the current
   * branch - the first to store the function call, and the second to store the
   * result.
   * @param isolate The name of the isolate to load the serials for
   */
  async serials(isolate: string) {
  }
  /**
   * When any of these functions are called, they will be executed in parallel
   * in a new branch, with no guarantee of order of execution.  A call to this
   * function will cause 3 commits to occur, 2 of which may be pooled with other
   * functions.  The commits are:
   * 1. The current branch, to declare the function invocation - may be pooled
   * 2. The new branch, to conclude the function invocation - may be skippable
   *    if no fs changes were made
   * 3. The curent branch, to merge the result back in - may be pooled
   * @param isolate The name of the isolate to load the parallels for
   */
  parallels(isolate: string) {
    // typescript made me do it
    return this.functions(isolate)
  }
  /**
   * Used to call the functions of an isolate purely, without going thru the IO
   * subsystem which would otherwise cost a commit to the chain.
   * @param isolate The name of the isolate to load the functions for
   * @returns An object keyed by API function name, with values being the
   * function itself.
   */
  functions(isolate: string) {
    // TODO these need some kind of PID attached ?
    const compartment = Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions(this)
  }
  isolateApiSchema(isolate: string) {
    const compartment = Compartment.create(isolate)
    return compartment.api
  }
  writeJSON(path: string, json: object) {
    isJsonPath(path)
    const file = JSON.stringify(json, null, 2)
    this.write(path, file)
  }
  write(path: string, file: string | Uint8Array) {
    isRelative(path)
    this.#fs.writeFileSync('/' + path, file)
  }
  async readJSON(path: string) {
    const string = await this.read(path)
    return JSON.parse(string)
  }
  async read(path: string) {
    isRelativeFile(path)
    const fs = this.#fs

    if (!fs.existsSync('/' + path)) {
      // TODO check if the file was deleted and in staging
      log('git read file', path)
      const results = await git.walk({
        fs,
        dir: '/',
        trees: [git.TREE()],
        map: async (filepath: string, [entry]) => {
          // TODO be efficient about tree walking for nested paths
          if (filepath === path) {
            const type = await entry!.type()
            assert(type === 'blob', 'only blobs are supported: ' + type)
            return await entry?.content()
          }
        },
      })
      if (results.length > 1) {
        throw new Error('multiple files found: ' + path)
      }
      if (!results.length) {
        throw FileNotFoundError.create(path)
      }
      return new TextDecoder().decode(results[0])
    }
    return fs.readFileSync('/' + path, 'utf8').toString()
  }
  async exists(path: string) {
    isRelative(path)
    try {
      this.#fs.statSync(path)
      return true
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    const results = await git.walk({
      fs: this.#fs,
      dir: '/',
      trees: [git.TREE()],
      map: async (filepath: string, [entry]) => {
        // TODO be efficient about tree walking for nested paths
        // TODO check directories are excluded
        if (filepath === path) {
          const type = await entry!.type()
          assert(type === 'blob', 'only blobs are supported: ' + type)
          return true
        }
      },
    })
    if (results.length) {
      assert(results.length === 1, 'multiple files found: ' + path)
      return true
    }
    return false
  }
  async ls(path: string) {
    isDirectory(path)
    // get the git listing
    const walk = await git.walk({
      fs: this.#fs,
      dir: '/',
      trees: [git.TREE()],
      map: async (filepath: string, [entry]) => {
        log('filepath', filepath)
        if (filepath.startsWith(path)) {
          return filepath
          // TODO do not automatically recurse
        }
      },
    })
    log('walk:', walk)
    // TODO handle deletion of files, which should be stored in the index
    // TODO check the filesystem hasn't changed
    return walk
  }
  rm(path: string) {
    isRelative(path)
    try {
      this.#fs.unlinkSync(path)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }
  get context() {
    // TODO at creation, this should flag context capable and reject if not
    return this.#context
  }
  set context(context: Partial<T>) {
    assert(typeof context === 'object', 'context must be an object')
    assert(context !== null, 'context must not be null')
    this.#context = context
  }
}

const isRelative = (path: string) =>
  assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
const isJsonPath = (path: string) => {
  assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
  isRelative(path)
}
const isRelativeFile = (path: string) => {
  isRelative(path)
  const basename = posix.basename(path)
  const test = path.endsWith(basename) && basename !== ''
  assert(test, `path must be a file, not a directory: ${path}`)
}
const isDirectory = (path: string) => {
  isRelative(path)
  assert(path.endsWith('/'), `path must be a directory: ${path}`)
}
class FileNotFoundError extends Error {
  code = 'ENOENT'
  static create(path: string) {
    return new FileNotFoundError('file not found: ' + path)
  }
  constructor(message: string) {
    super(message)
    this.name = 'FileNotFoundError'
  }
}
