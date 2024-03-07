import Compartment from './io/compartment.ts'
import { IFs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { Debug, deserializeError, equal, print } from '@utils'
import git from '$git'
import FS from '@/artifact/fs.ts'
import {
  DispatchFunctions,
  getProcType,
  IsolatePromise,
  Params,
  PID,
  ProcessOptions,
  PROCTYPE,
  SolidRequest,
} from '@/artifact/constants.ts'

const log = Debug('AI:isolateApi')
interface Default {
  [key: string]: unknown
}
const dir = '/'
export default class IsolateApi<T extends object = Default> {
  #fs!: IFs
  #commit: string | undefined
  #pid: PID | undefined
  #accumulator: IsolatePromise[] | undefined
  #accumulatorCount = 0
  // TODO assign a mount id for each side effect execution context ?
  #context: Partial<T> = {}
  static createFS(fs: IFs, atCommit?: string) {
    const api = new IsolateApi()
    api.#fs = fs
    api.#commit = atCommit
    return api
  }
  static create(fs: IFs, commit: string, pid: PID, acc: IsolatePromise[]) {
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
        const prior = this.#accumulator[request.sequence]
        if (prior) {
          assert(equal(prior.request, request), 'request mismatch')
          if (prior.outcome) {
            if (prior.outcome.error) {
              return Promise.reject(deserializeError(prior.outcome.error))
            }
            return Promise.resolve(prior.outcome.result)
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
        trees: [git.TREE({ ref: this.#commit })],
        map: async (filepath: string, [entry]) => {
          // TODO be efficient about tree walking for nested paths
          if (filepath === path) {
            const type = await entry!.type()
            assert(type === 'blob', 'only blobs are supported: ' + type)
            return await entry?.content()
          }
        },
      })
      assert(results.length <= 1, 'multiple files found: ' + path)
      if (!results.length) {
        log(FS.print(fs))
        throw new FileNotFoundError('file not found: ' + path)
      }
      return new TextDecoder().decode(results[0])
    }
    return fs.readFileSync('/' + path, 'utf8').toString()
  }
  async exists(path: string) {
    isRelative(path)
    try {
      this.#fs.statSync('/' + path)
      return true
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    const results = await git.walk({
      fs: this.#fs,
      dir: '/',
      // TODO use the commit and also check with stage
      trees: [git.STAGE()],
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
