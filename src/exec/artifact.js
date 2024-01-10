import IO from './io.js'
import { deserializeError } from 'serialize-error'
import validator from './validator.js'
import posix from 'path-browserify'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import loader from '../boot/loader.md?raw'
import README from '../boot/README.md?raw'
import assert from 'assert-fast'
import promptRunner from './prompt-runner.js'
import TriggerFS from './trigger-fs.js'
import Debug from 'debug'
const debug = Debug('AI:artifact')
globalThis.Buffer = Buffer

export default class Artifact {
  #fs
  #dir
  #cache
  #opts
  #session
  #trigger
  #io
  static async boot({ path = 'fs', wipe = false } = {}) {
    const artifact = new Artifact()
    artifact.#trigger = TriggerFS.create()
    artifact.#fs = new LightningFS(path, { wipe }).promises
    artifact.#dir = '/hal'
    artifact.#session = '/hal/.session.json'
    artifact.#cache = {}
    artifact.#opts = {
      fs: artifact.#fs,
      dir: artifact.#dir,
      cache: artifact.#cache,
    }
    artifact.#io = IO.create({ artifact, opts: artifact.#opts })
    await artifact.#load()
    await artifact.#io.start()
    return artifact
  }
  async stop() {
    await this.#io.stop()
  }
  async #load() {
    debug('checking repo')
    let isGitPresent = false
    try {
      const filepath = this.#dir
      const gitRoot = await git.findRoot({ ...this.#opts, filepath })
      debug('gitRoot', gitRoot)
      isGitPresent = true
    } catch (e) {
      isGitPresent = false
    }
    if (!isGitPresent) {
      await this.#init()
    }

    // then look for tension in the fs we just loaded

    // want to get to an api call out to openai, and can only use md files and ai to do so
    // the bootai is always present

    // with no AI, it should be at least a filesystem with base commands
    // TODO add an emergency exit key sequence to default the pipe
  }
  async #init() {
    debug('creating repo')
    await this.#fs.mkdir(this.#dir).catch((e) => {
      if (!e.message.startsWith('EEXIST')) {
        throw e
      }
    })
    await git.init(this.#opts)
    const readmeP = this.#fs.writeFile(this.#dir + '/README.md', README)
    const loaderP = this.#fs.writeFile(this.#dir + '/loader.md', loader)
    const sessionP = this.#fs.writeFile(this.#session, JSON.stringify([]))
    await Promise.all([readmeP, loaderP, sessionP])
    await this.#commitAll({ message: 'init', author: { name: 'HAL' } })
  }
  async prompt(text) {
    assert(typeof text === 'string', `text must be a string`)
    assert(text, `text must not be empty`)
    // TODO move to a generic call model internally as well as for extra fns
    // TODO use a link to redirect output to different places
    // there should be one input per session

    // V1
    // - read in the session file, which is .json
    // - obtain lock on the session file
    // - modify the json with the latest prompt
    // - write the json back to the session file
    // - do a commit and release the lock, maybe trigger githooks
    // - trigger an api call to openai using the given file

    // - openai api function grabs lock on the session file
    // - reads the session file
    // - makes the openai api, streaming the results back into the session file
    // - releases the lock
    // - makes a commit with the user being the api caller
    // - system now waits for the next prompt / driver / tension
    // - maybe run the githooks based on what is configured

    const sessionPath = this.#session
    const trigger = this.#trigger
    const result = await promptRunner({
      fs: this.#fs,
      sessionPath,
      text,
      trigger,
    })
    await this.#commitAll({ message: 'promptRunner', author: { name: 'HAL' } })
    return result
  }
  async read(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const contents = await this.#fs.readFile(this.#dir + path, 'utf8')
    return contents
  }
  async log({ filepath, depth }) {
    const log = await git.log({ ...this.#opts, filepath, depth })
    return log
  }
  subscribe(path, cb) {
    // TODO cache the results for a path
    const initial = this.#fs.readFile(path, 'utf8')
    return this.#trigger.subscribe(path, cb, initial)
  }
  // TODO ensure subscriptions await the callback in a queue
  // so implementations can be asured they get called in sequence
  async subscribeCommits(filepath, cb) {
    assert(posix.isAbsolute(filepath), `filepath must be absolute: ${filepath}`)
    // TODO cache the results
    // async since needs to find the nearest repo root
    const repoPath = await git.findRoot({ ...this.#opts, filepath })
    assert(repoPath, `repoPath not found: ${filepath}`)
    // TODO order the async git functions using an async iterable
    if (repoPath === filepath) {
      return this.#trigger.subscribeCommits(repoPath, cb)
    }
    const relative = posix.relative(repoPath, filepath)
    return this.#trigger.subscribeCommits(repoPath, async () => {
      // TODO move to using a walker with the hash

      const commit = await git.log({
        ...this.#opts,
        depth: 1,
        filepath: relative,
        force: true,
      })
      if (!commit.length) {
        return
      }
      // TODO ensure the worktree is the actual unfettered item
      // TODO handle directories ?
      const file = await this.#fs.readFile(filepath, 'utf8')
      cb(file)
    })
  }
  async createIO({ path, isolate }) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    assert(path.endsWith('.io.json'), `path must end with .io.json`)
    assert(typeof isolate === 'object', `isolate must be an object`)
    // TODO error if something already there
    // TODO load the isolate in a worker to check it loads correctly

    const io = {
      isolate,
      sequence: 0,
      inputs: {},
      outputs: {},
      // how to clean the queue out ?
    }
    await this.#commitIO(path, io, 'createIO')

    // drop down the json item
    // check the api schema matches the loaded code
    // commit the code, possibly register with procman
  }
  async actions(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    // assert the path is an io path
    const io = await this.readIO(path)
    const { isolate } = io
    // check the schema, or rely on the hooks to ensure the format is correct
    const { api } = isolate
    const actions = {}
    for (const functionName of Object.keys(api)) {
      const schema = api[functionName]
      const validate = validator(schema)
      actions[functionName] = async (parameters) => {
        validate(parameters)
        return this.dispatch(path, functionName, parameters)
      }
    }
    Object.freeze(actions)
    return actions
  }
  overloadExecutable(path, localPath) {
    this.#io.overloadExecutable(path, localPath)
  }
  async dispatch(ioPath, functionName, parameters) {
    assert(posix.isAbsolute(ioPath), `ioPath must be absolute: ${ioPath}`)
    const io = await this.readIO(ioPath)

    const { id, next } = input(io, functionName, parameters)
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    const unsubscribe = await this.subscribeCommits(ioPath, (file) => {
      const next = JSON.parse(file)

      const { outputs } = next
      const output = outputs[id]
      if (!output) {
        return
      }
      if (output.error) {
        reject(deserializeError(output.error))
      } else {
        resolve(output.result)
      }
      unsubscribe()
    })
    await this.#commitIO(ioPath, next, 'dispatch')
    return promise
  }
  async readIO(path) {
    // TODO assert the path is not dirty
    // TODO check the schema of the IO file
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const raw = await this.#fs.readFile(path, 'utf8')
    return JSON.parse(raw)
  }
  async #commitIO(path, io, message) {
    const file = JSON.stringify(io, null, 2)
    await this.#fs.writeFile(path, file)
    this.#trigger.write(path, file)
    await this.#commitAll({ message, author: { name: 'HAL' } })
  }
  async replyIO(filepath, id, result, error) {
    // TODO handle further processes being spawned
    // TODO allow to buffer multiple replies into a single commit

    filepath = '/hal/' + filepath
    assert(posix.isAbsolute(filepath), `path must be absolute: ${filepath}`)
    const io = await this.readIO(filepath)
    const { outputs } = io
    assert(!outputs[id], `id ${id} found in outputs`)
    outputs[id] = { result, error }
    await this.#commitIO(filepath, io, 'replyIO')
  }
  async #commitAll({ message, author }) {
    const status = await git.statusMatrix(this.#opts)
    const files = status.map((status) => status[0])
    await git.add({ ...this.#opts, filepath: files })
    const hash = await git.commit({ ...this.#opts, message, author })
    this.#trigger.commit(this.#dir, hash)
  }
}

const input = (io, functionName, parameters) => {
  const { inputs, outputs } = io
  const id = io.sequence
  const action = { [functionName]: parameters }
  const nextInputs = { ...inputs, [id]: action }
  const sequence = id + 1
  const next = { ...io, sequence, inputs: nextInputs, outputs }
  return { id, next }
}
