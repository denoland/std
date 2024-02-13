import Compartment from './io/compartment.ts'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import debug from '$debug'
import git from '$git'

const log = debug('AI:isolateApi')
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
  isolateActions(isolate: string) {
    // TODO these need some kind of PID attached ?
    const compartment = Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions(this)
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
  isFile(path: string) {
    isRelative(path)
    try {
      this.#fs.statSync(path)
      return true
    } catch (err) {
      if (err.code === 'ENOENT') {
        log('isFile not found:', path)
        return false
      }
      throw err
    }
  }
  async ls(path: string) {
    isRelative(path)
    // get the git listing
    const walk = await git.walk({
      fs: this.#fs,
      dir: '/',
      trees: [git.TREE()],
      map: async (filepath: string, [entry]) => {
        log('filepath', filepath)
        // if (
        //   // don't skip the root directory
        //   filepath !== '.' &&
        //   !path.startsWith(filepath) &&
        //   posixDirname(filepath) !== path
        // ) {
        //   return null
        // } else {
        //   return filepath
        // }
        // const type = await entry!.type()
        // if (type === 'tree') {
        //   return
        // }
        // if (filepath.startsWith(path)) {
        //   return filepath
        // }
        // return null
      },
    })
    debugger
    // but we can't actually deal with directories in git since it doesn't
    // do dirs
    const gitFiles = await git.listFiles({ fs: this.#fs, dir: '/' })
    // then merge with the listing on the actual filesystem, if anything

    // TODO handle deletion of files, which should be stored in the index
    const files = this.#fs.readdirSync('/' + path)
    return files
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
