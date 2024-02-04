import git from 'https://esm.sh/isomorphic-git@1.25.3'
import { IFs } from 'https://esm.sh/memfs@4.6.0'
import Artifact from '../artifact.ts'
import validator from '@io/validator.js'
import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from '$debug'
import { Isolate, Parameters } from '@/artifact/constants.ts'
import { JsonValue } from '@/artifact/constants.ts'

const log = debug('AI:io-worker')

const worker = () => {
  // TODO set up SES compartments
  // TODO useMemo  where it caches the result for recoverability by a commit
  // TODO make paradigm where heavy functions are replayable
  // TODO force the use of sideEffects for network calls

  let module: Isolate
  return {
    async load(isolate: string) {
      assert(!module, 'module already loaded: ' + isolate)
      log('load isolate:', isolate)
      module = await import(`../isolates/${isolate}.js`) as Isolate
      const { functions, api } = module
      assert(typeof api === 'object', 'api not exported')
      assert(typeof functions === 'object', 'functions not exported')
      assert(Object.keys(module.api).length, 'api not exported')
      const missing = Object.keys(api).filter((key) => !functions[key])
      assert(!missing.length, `Missing functions: ${missing.join(', ')}`)
      return api
    },
    async snapshot(artifact: Artifact, repo: string, branch: string) {
      assert(module, 'code not loaded')
      // get a memfs snapshot of the head of this branch

      // really want api commands that operate on the fs
      // so all artifact commands should operate on a specific instance of fs
      // and by changing this out, we can achieve isolation

      // hooks need to be loaded in an isolated compartment here
      const fs = await artifact.snapshot(repo, branch)
      const fsApi = new FsApi(fs, artifact)
      return (functionName: string, parameters: Parameters) => {
        const { functions, api } = module
        const schema = api[functionName]
        validator(schema)(parameters)
        // TODO move to SES compartments with a global import for the api
        return functions[functionName](parameters, fsApi)
      }
    },
    toActions(api: FsApi) {
      assert(module, 'code not loaded')
      // used by other isolates to call actions without going via io
      const actions: Record<string, (parameters: Parameters) => unknown> = {}
      for (const functionName in module.api) {
        actions[functionName] = (parameters: Parameters) => {
          const schema = module.api[functionName]
          validator(schema)(parameters)
          return module.functions[functionName](parameters, api)
        }
      }
      return actions
    },
  }
}
export default worker

export class FsApi {
  #fs: IFs
  #artifact: Artifact
  constructor(fs: IFs, artifact: Artifact) {
    this.#fs = fs
    this.#artifact = artifact
  }
  async isolateActions(isolate: string) {
    const worker = await this.#artifact.io.worker(isolate)
    return worker.toActions(this)
  }
  writeJSON(path: string, json: JsonValue) {
    isJSON(path)
    const file = JSON.stringify(json, null, 2)
    this.#fs.writeFileSync(path, file)
  }
  write(path = '/', file: string | Uint8Array) {
    isRelative(path)
    this.#fs.writeFileSync(path, file)
  }
  async readJSON(path: string) {
    isRelative(path)
    // check if it exists
    // then do a git checkout for that file
    const fs = this.#fs
    if (!this.#fs.existsSync(path)) {
      // TODO must specify branch
      log('checkout', path)
      await git.checkout({ fs, dir: '/', filepaths: [path] })
    }
    const string = fs.readFileSync('/' + path, 'utf8').toString()
    return JSON.parse(string)
  }
  read(path: string): string {
    isRelative(path)
    const contents = this.#fs.readFileSync(path, 'utf8').toString()
    return contents
  }
  isFile(path = '/') {
    isRelative(path)
    try {
      this.#fs.statSync(path)
      return true
    } catch (err) {
      if (err.code === 'ENOENT') {
        return false
      }
      throw err
    }
  }
  ls(path = '/') {
    isRelative(path)
    const files = this.#fs.readdirSync(path)
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
}

const isRelative = (path: string) =>
  assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
const isJSON = (path: string) => {
  assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
  isRelative(path)
}
