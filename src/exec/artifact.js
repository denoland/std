import equal from 'fast-deep-equal'
import IO from './io.js'
import { deserializeError } from 'serialize-error'
import validator from './validator.js'
import posix from 'path-browserify'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import assert from 'assert-fast'
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
    const opts = { ...artifact.#opts, trigger: artifact.#trigger }
    artifact.#io = IO.create({ artifact, opts })
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
    // TODO walk for IO changes with no ooutputs and load them
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
    await this.#fs.mkdir(this.#dir + '/prompts')
    const prompts = ['goalie', 'loader', 'chat']
    await Promise.all(
      prompts.map(async (slug) => {
        const name = '/prompts/' + slug + '.md'
        const file = await import(`../prompts/${slug}.md?raw`)
        await this.#fs.writeFile(this.#dir + name, file.default)
      })
    )
    debug('filesystem created')
    await this.#commitAll({ message: 'init', author: { name: 'HAL' } })
  }
  async chatUp() {
    const path = '/chat-1.io.json'
    const codePath = '/hal/isolates/chat.js'
    const sessionPath = '/hal/chat-1.session.json'
    const systemPromptPath = '/hal/prompts/chat.md'
    const isolate = {
      codePath,
      type: 'function',
      language: 'javascript',
      api: await this.#io.loadWorker(codePath),
      config: { sessionPath, systemPromptPath },
    }
    await this.#fs.writeFile(sessionPath, JSON.stringify([]))
    await this.createIO({ path, isolate })
    return await this.actions(path)
  }
  async goalUp() {
    const path = '/chat-1.io.json'
    const codePath = '/hal/isolates/chat.js'
    const sessionPath = '/hal/chat-1.session.json'
    const systemPromptPath = '/hal/prompts/goalie.md'
    const isolate = {
      codePath,
      type: 'function',
      language: 'javascript',
      api: await this.#io.loadWorker(codePath),
      config: { sessionPath, systemPromptPath },
    }
    await this.#fs.writeFile(sessionPath, JSON.stringify([]))
    await this.createIO({ path, isolate })
    return await this.actions(path)
  }
  async read(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const contents = await this.#fs.readFile(this.#dir + path, 'utf8')
    return contents
  }
  async log({ filepath = '/', depth }) {
    filepath = filepath === '/' ? '/hal' : posix.resolve('/hal', filepath)
    const repoPath = await git.findRoot({ ...this.#opts, filepath })
    assert(repoPath, `repoPath not found: ${filepath}`)
    const relative = posix.relative(repoPath, filepath) //?
    return await git.log({ ...this.#opts, filepath: relative, depth })
  }
  subscribe(path, cb) {
    // TODO cache the results for a path
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = this.#dir + path
    const initial = this.#fs.readFile(absolute, 'utf8')
    return this.#trigger.subscribe(absolute, cb, initial)
  }
  // TODO ensure subscriptions await the callback in a queue
  // so implementations can be asured they get called in sequence
  async subscribeCommits(filepath, cb) {
    // TODO cache the results
    // TODO do an initial load up so the subscriber starts with the latest one
    // TODO root vs file should be different function calls
    // async since needs to find the nearest repo root
    assert(posix.isAbsolute(filepath), `filepath must be absolute: ${filepath}`)
    filepath = filepath === '/' ? '' : filepath
    filepath = posix.normalize('/hal' + filepath)
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
    const api = await this.#io.loadWorker(isolate.codePath)
    if (isolate.api) {
      assert(equal(api, isolate.api), 'api mismatch')
    }
    isolate = { type: 'function', language: 'javascript', ...isolate, api }
    const io = {
      isolate,
      sequence: 0,
      inputs: {},
      outputs: {},
    }
    await this.#commitIO(path, io, 'createIO')
  }
  async actions(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    assert(path.endsWith('.io.json'), `path must end with .io.json: ${path}`)
    debug('actions', path)
    const io = await this.readIO(path)
    const { isolate } = io
    const { api } = isolate
    const actions = {}
    for (const functionName of Object.keys(api)) {
      // TODO make this a lazy proxy that replaces keys each time it is called
      const schema = api[functionName]
      const validate = validator(schema)
      actions[functionName] = async (parameters = {}) => {
        validate(parameters)
        return this.dispatch(path, functionName, parameters)
      }
    }
    Object.freeze(actions)
    debug('actions', path, Object.keys(actions))
    return actions
  }
  overloadExecutable(path, localPath) {
    this.#io.overloadExecutable(path, localPath)
  }
  async dispatch(ioPath, functionName, parameters) {
    assert(posix.isAbsolute(ioPath), `ioPath must be absolute: ${ioPath}`)
    debug('dispatch', ioPath, functionName, parameters)
    const io = await this.readIO(ioPath)

    const { id, next } = input(io, functionName, parameters)
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    // TODO use promise maps for callback of the prompt

    const unsubscribe = await this.subscribeCommits(ioPath, (file) => {
      debug('dispatch commit trigger', ioPath)
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
  async replyIO({ path, functionName, id, result, error }) {
    // TODO handle further processes being spawned
    // TODO allow to buffer multiple replies into a single commit

    const absolute = posix.resolve('/hal', path)
    const io = await this.readIO(absolute)
    const { outputs } = io
    assert(!outputs[id], `id ${id} found in outputs`)
    outputs[id] = { result, error }
    debug('replyIO', path, functionName, id, result, error)
    await this.#commitIO(absolute, io, `Reply: ${path}:${functionName}():${id}`)
    // TODO resolve the promise map here
  }
  async readIO(path) {
    // TODO assert the path is not dirty
    // TODO check the schema of the IO file
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const raw = await this.#fs.readFile(this.#dir + path, 'utf8')
    return JSON.parse(raw)
  }
  async #commitIO(path, io, message) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const absolute = this.#dir + path
    debug('commitIO', path, absolute)
    const file = JSON.stringify(io, null, 2)
    await this.#fs.writeFile(absolute, file)
    this.#trigger.write(absolute, file)
    const filepath = posix.relative(this.#dir, absolute)
    await git.add({ ...this.#opts, filepath })
    // TODO move to one branch per io process
    await this.#commitAll({ message, author: { name: 'HAL' } })
  }
  async #commitAll({ message, author }) {
    // TODO confirm this adds all files
    await git.add({ ...this.#opts, filepath: '.' })
    await this.#commit({ message, author })
  }
  async #commit({ message, author }) {
    // TODO check commit not empty
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
