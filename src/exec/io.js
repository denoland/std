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
  static create({ artifact, opts }) {
    const runner = new IO()
    runner.#artifact = artifact
    runner.#opts = opts
    return runner
  }
  // TODO track purging that is due - immdediately after a commit, clear io.
  async start() {
    // TODO subscribe to writes, so we can do internal actions with less commits
    await this.#artifact.subscribeCommits('/', async (ref) => {
      debug('io commit triggered', ref.substr(0, 7))
      const commit = await git.readCommit({ ...this.#opts, oid: ref })
      const { parent } = commit.commit
      const changes = await git.walk({
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

      for (const { actions, io, path } of changes) {
        // TODO handle the isolate changing
        // TODO handle resetting the IO which would terminate all in progress
        debug('io changes', path, actions)
        const { isolate } = io
        if (!this.#workerCache.has(path)) {
          const { codePath, api } = isolate
          const resolvedCodePath = this.#resolveCodePath(codePath)
          const worker = ioWorker(this.#opts)
          const loadedApi = await worker.load(resolvedCodePath)
          assert(equals(loadedApi, api), 'api mismatch')
          this.#workerCache.set(path, { api, worker })
          // TODO LRU the cache
        }
        const { api, worker } = this.#workerCache.get(path)
        for (const { action, id } of actions) {
          for (const [functionName, parameters] of Object.entries(action)) {
            const schema = api[functionName]
            validator(schema)(parameters)
            debug('dispatch', path, functionName, parameters)
            worker
              .call(functionName, parameters, isolate.config)
              .then((result) => {
                return this.#artifact.replyIO({
                  path,
                  functionName,
                  id,
                  result,
                })
              })
              .catch((errorObj) => {
                const error = serializeError(errorObj)
                debug('dispatch error', error)
                return this.#artifact.replyIO({ path, functionName, id, error })
              })
          }
        }
      }
    })
  }
  #resolveCodePath(codePath) {
    assert(posix.isAbsolute(codePath), `codePath must be absolute: ${codePath}`)
    debug('resolveCodePath', codePath)
    if (this.#debuggingOverloads.has(codePath)) {
      const override = this.#debuggingOverloads.get(codePath)
      const viteImportRegex = /^\.\/isolate-(.*)\.js$/
      const match = override.match(viteImportRegex)
      assert(match, `invalid codePath: ${codePath} with override: ${override}`)
      const [, name] = match
      assert(name, `invalid slug: ${name}`)
      return name
    }
    throw new Error(`Not Implemented: dynamic imports ${codePath}`)
  }
  async loadWorker(codePath) {
    const resolvedCodePath = this.#resolveCodePath(codePath)
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
