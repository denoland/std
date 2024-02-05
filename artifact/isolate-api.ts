import { IFs } from 'https://esm.sh/memfs@4.6.0'
import { assert } from 'std/assert/mod.ts'
import { JsonValue } from '@/artifact/constants.ts'
import Artifact from './artifact.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { debug } from '$debug'
import git from '$git'

const log = debug('AI:isolateApi')

export default class IsolateApi {
  #fs: IFs
  #artifact: Artifact
  static create(fs: IFs, artifact: Artifact) {
    return new IsolateApi(fs, artifact)
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
