import equals from 'fast-deep-equal'
import validator from './validator'
import ioWorker from './io-worker'
import assert from 'assert-fast'
import git, { TREE } from 'isomorphic-git'
import { posix } from 'path-browserify'
import { toString } from 'uint8arrays/to-string'
import { serializeError } from 'serialize-error'
import Debug from 'debug'
const debug = Debug('AI:io')

export default class IO {
  #artifact
  #opts
  #debuggingOverloads = new Map()
  #workerCache = new Map()
  #promiseMap = new Map() // path -> promise ?
  static create({ artifact, opts }) {
    const io = new IO()
    io.#artifact = artifact
    io.#opts = { ...opts, artifact }
    return io
  }
  // TODO track purging that is due - immdediately after a commit, clear io.
  async start() {
    // TODO subscribe to writes, so we can do internal actions with less commits
    await this.#artifact.subscribeCommits('/', async (ref) => {
      debug('io commit triggered', ref.substr(0, 7))
      const changes = await this.#diffChanges(ref)

      for (const { actions, io, path } of changes) {
        // TODO handle resetting the IO which would terminate all in progress
        debug('io changes', path, actions)
        const { api, worker } = await this.#ensureWorker(path, io)
        for (const { action, id } of actions) {
          for (const [functionName, parameters] of Object.entries(action)) {
            const schema = api[functionName]
            validator(schema)(parameters)
            debug('dispatch', path, functionName, parameters)
            const args = { path, functionName, id }
            worker
              .execute(functionName, parameters, io.isolate.config)
              .then((result) => this.#artifact.replyIO({ ...args, result }))
              .catch((errorObj) => {
                const error = serializeError(errorObj)
                debug('dispatch error', error)
                return this.#artifact.replyIO({ ...args, error })
              })
          }
        }
      }
    })
  }
  async #diffChanges(ref) {
    const commit = await git.readCommit({ ...this.#opts, oid: ref })
    const { parent } = commit.commit
    return await git.walk({
      ...this.#opts,
      trees: [TREE({ ref }), TREE({ ref: parent[0] })],
      map: async (path, [current, previous]) => {
        if (path.endsWith('.io.json') && current) {
          // TODO use the artifact readio method, to check schema
          const io = JSON.parse(toString(await current.content(), 'utf8'))
          const previousIo =
            previous && JSON.parse(toString(await previous.content(), 'utf8'))
          const actions = newActions(io.inputs, previousIo?.inputs || {})
          return { path: '/' + path, actions, io }
        }
      },
    })
  }
  async #ensureWorker(path, io) {
    if (!this.#workerCache.has(path)) {
      // TODO handle the isolate changing
      const { codePath, api } = io.isolate
      const resolvedCodePath = this.#resolveCodePathSlug(codePath)
      const worker = ioWorker(this.#opts)
      const loadedApi = await worker.load(resolvedCodePath)
      assert(equals(loadedApi, api), 'api mismatch')
      this.#workerCache.set(path, { api, worker })
      // TODO LRU the cache
    }
    return this.#workerCache.get(path)
  }
  #resolveCodePathSlug(codePath) {
    assert(posix.isAbsolute(codePath), `codePath must be absolute: ${codePath}`)
    debug('resolveCodePath', codePath)
    let override
    if (this.#debuggingOverloads.has(codePath)) {
      // TODO get this working when it is actually needed somewhere
      codePath = this.#debuggingOverloads.get(codePath)
      override = codePath
    }
    const viteImportRegex = /^\/hal\/isolates\/(.*)\.js$/
    const match = codePath.match(viteImportRegex)
    assert(match, `invalid codePath: ${codePath} with override: ${override}`)
    const [, slug] = match
    assert(slug, `invalid slug: ${slug}`)
    return slug
  }
  async loadWorker(codePath) {
    const resolvedCodePath = this.#resolveCodePathSlug(codePath)
    debug('resolved', codePath, 'to', resolvedCodePath)
    const worker = ioWorker(this.#opts)
    return await worker.load(resolvedCodePath)
  }
  async stop() {
    const cached = [...this.#workerCache.values()]
    this.#workerCache.clear()
    for (const { worker } of cached) {
      // await Thread.terminate(worker)
    }
  }
  overloadExecutable(path, localPath) {
    // TODO allow glob pattern overrides
    // TODO allow artifact to be single threaded fro debugging the workers
    // TODO assert we are not in production mode
    // TODO check it exists by loading it in a webworker module
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    this.#debuggingOverloads.set(path, localPath)
  }
}

const newActions = (inputs, previous) => {
  const indices = []
  // TODO BUT if you blanked them every commit, no need to diff them ?
  for (const id of Object.keys(inputs)) {
    if (previous[id]) {
      continue
    }
    indices.push(Number.parseInt(id))
  }
  indices.sort((a, b) => a - b)
  return indices.map((id) => ({ action: inputs[id], id }))
}
