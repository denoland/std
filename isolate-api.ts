import stringify from 'npm:safe-stable-stringify'
import Accumulator from './exe/accumulator.ts'
import Compartment from './io/compartment.ts'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { Debug, equal, fromOutcome, print } from '@utils'
import git, { WalkerEntry } from '$git'
import {
  DispatchFunctions,
  getProcType,
  IFs,
  Params,
  PID,
  ProcessOptions,
  PROCTYPE,
  SolidRequest,
} from '@/constants.ts'
type WalkerCallback = (entry: WalkerEntry) => Promise<unknown>
const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
const dir = '/'

export default class IsolateApi<T extends object = Default> {
  #fs: IFs | undefined
  #commit: string | undefined
  #pid: PID | undefined
  #accumulator: Accumulator | undefined
  #accumulatorCount = 0
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  static createContext() {
    return new IsolateApi()
  }
  static createFS(fs: IFs, commit: string) {
    assert(commit.length === 40, 'commit must be 40 characters: ' + commit)
    const api = new IsolateApi()
    api.#fs = fs
    api.#commit = commit
    return api
  }
  static create(fs: IFs, commit: string, pid: PID, acc: Accumulator) {
    assert(commit.length === 40, 'commit must be 40 characters')
    const api = new IsolateApi()
    api.#fs = fs
    api.#commit = commit
    api.#pid = pid
    api.#accumulator = acc
    return api
  }
  get pid() {
    assert(this.#pid, 'pid not set')
    return this.#pid
  }
  // TODO make targetPID be required, as error to dispatch serially to self
  async actions(isolate: string, targetPID?: PID) {
    const target = targetPID ? targetPID : this.pid
    log('actions', isolate, print(target))
    const schema = await this.isolateApiSchema(isolate)
    const actions: DispatchFunctions = {}
    for (const functionName of Object.keys(schema)) {
      actions[functionName] = (params?: Params, options?: ProcessOptions) => {
        log('actions %o', functionName)
        // TODO unify how proctype is derived across all cradles
        if (equal(targetPID, this.pid)) {
          if (!options) {
            options = { branch: true }
          }
          assert(options.branch || options.noClose, 'no loopback serial')
        }
        const proctype = getProcType(options)
        assert(this.#accumulator, 'accumulator must be set')
        if (equal(target, this.pid) && proctype === PROCTYPE.SERIAL) {
          return Promise.reject(new Error('cannot dispatch to self'))
        }
        const request: SolidRequest = {
          target,
          source: this.pid,
          sequence: this.#accumulatorCount++,

          isolate,
          functionName,
          params: params || {},
          proctype,
        }
        const recovered = this.#accumulator.recover(request.sequence)
        if (recovered) {
          if (!equal(recovered.request, request)) {
            console.dir('recovered', recovered.request)
            console.dir('request', request)
          }
          assert(equal(recovered.request, request), 'request mismatch')
          const { outcome } = recovered
          if (outcome) {
            return Promise.resolve().then(() => fromOutcome(outcome))
          }
        }

        const promise = new Promise((resolve, reject) => {
          this.#accumulator!.push({ request, resolve, reject })
        })
        return promise
      }
    }

    return actions
  }
  /**
   * Used to call the functions of an isolate purely, without going thru the IO
   * subsystem which would otherwise cost a commit to the chain.
   * @param isolate The name of the isolate to load the functions for
   * @returns An object keyed by API function name, with values being the
   * function itself.
   */
  async functions(isolate: string) {
    // TODO these need some kind of PID attached ?
    const compartment = await Compartment.create(isolate)
    // TODO but these need to be wrapped in a dispatch call somewhere
    return compartment.functions(this)
  }
  async isolateApiSchema(isolate: string) {
    const compartment = await Compartment.create(isolate)
    return compartment.api
  }
  writeJSON(path: string, json: object) {
    isJsonPath(path)
    const content = stringify(json, null, 2)
    this.write(path, content)
  }
  write(path: string, content: string | Uint8Array) {
    assert(this.#fs, 'fs must be set')
    log('write', path)
    isRelative(path)
    this.#fs.writeFileSync('/' + path, content)
    if (this.#accumulator) {
      this.#accumulator.write(path, content)
    }
  }
  async readJSON(path: string) {
    const string = await this.read(path)
    return JSON.parse(string)
  }
  async read(path: string) {
    log('read', path)
    isRelativeFile(path)
    if (!this.exists(path)) {
      throw new FileNotFoundError('file not found: ' + path)
    }
    if (this.#accumulator) {
      if (this.#accumulator.upserts.includes(path)) {
        return this.#accumulator.read(path)
      }
    }
    if (this.#fs?.existsSync('/' + path)) {
      return this.#fs.readFileSync('/' + path, 'utf8')
    }
    const result = await this.#walkOne(path, async (tree) => {
      const content = await tree.content()
      assert(content, 'content must be defined')
      return new TextDecoder().decode(content)
    })
    if (!result) {
      throw new FileNotFoundError('file not found: ' + path)
    }
    return result
  }
  async exists(path: string) {
    assert(this.#commit, 'commit must be set')
    assert(this.#fs)
    log('exists', path)
    isRelative(path)
    if (this.#accumulator) {
      // we are in transient mode
      if (this.#accumulator.upserts.includes(path)) {
        return true
      }
      if (this.#accumulator.deletes.includes(path)) {
        return false
      }
    }
    if (this.#fs.existsSync('/' + path)) {
      return true
    }
    const result = await this.#walkOne(path, (_tree) => Promise.resolve(true))
    return !!result
  }
  async #walkOne(path: string, callback: WalkerCallback) {
    const results = await this.#walk(path, callback)
    if (results.length) {
      assert(results.length === 1, 'multiple files found: ' + path)
      return results[0]
    }
  }
  async #walk(path: string, callback: WalkerCallback) {
    assert(this.#commit, 'commit must be set')
    assert(this.#fs, 'fs must be set')
    const trees = [git.TREE({ ref: this.#commit })]
    log('#walk commit', this.#commit)
    const results = await git.walk({
      fs: this.#fs,
      dir: '/',
      trees,
      map: async (filepath: string, [tree]) => {
        // TODO be efficient about tree walking for nested paths
        // TODO check directories are excluded
        if (filepath === path) {
          assert(tree, 'tree must be defined: ' + filepath)
          const type = await tree.type()
          assert(type === 'blob', 'only blobs are supported: ' + type)
          return await callback(tree)
        }
      },
    })
    return results
  }

  async ls(path: string) {
    assert(this.#commit, 'commit must be set')
    assert(this.#fs, 'fs must be set')
    path = posix.join(path, '/')
    isRelative(path)

    const walk = await git.walk({
      fs: this.#fs,
      dir: '/',
      trees: [git.TREE({ ref: this.#commit })],
      map: async (filepath: string, [_entry]) => {
        log('filepath', filepath)
        if (filepath.startsWith(path)) {
          await Promise.resolve() // typescript made me do it
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
  async rm(filepath: string) {
    assert(this.#commit, 'commit must be set')
    assert(this.#fs, 'fs must be set')

    log('rm', filepath)
    if (await this.exists(filepath)) {
      try {
        this.#fs.unlinkSync(filepath)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
      const fs = this.#fs
      await git.remove({ fs, dir, filepath })
      if (this.#accumulator) {
        this.#accumulator.delete(filepath)
      }
      return true
    }
    return false
    // TODO make sure rm and write update the index
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
class FileNotFoundError extends Error {
  code = 'ENOENT'
  constructor(message: string) {
    super(message)
    this.name = 'FileNotFoundError'
  }
}
