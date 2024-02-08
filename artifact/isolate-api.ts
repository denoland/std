import { IFs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import { JsonValue } from '@/artifact/constants.ts'
import Artifact from './artifact.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import debug from '$debug'
import git from '$git'

const log = debug('AI:isolateApi')

export default class IsolateContext {
  #fs: IFs
  #artifact: Artifact
  static create(fs: IFs, artifact: Artifact) {
    return new IsolateContext(fs, artifact)
  }
  constructor(fs: IFs, artifact: Artifact) {
    this.#fs = fs
    this.#artifact = artifact
  }
  async isolateActions(isolate: string) {
    const worker = await this.#artifact.io.worker(isolate)
    return worker.toActions(this)
  }
  writeJSON(path: string, json: JsonValue) {
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
    isRelative(path)
    const fs = this.#fs
    if (!fs.existsSync('/' + path)) {
      log('checkout', path)
      await git.checkout({ fs, dir: '/', filepaths: [path] })
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
const isJsonPath = (path: string) => {
  assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
  isRelative(path)
}
