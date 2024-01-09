import validator from './validator'
import { spawn, Thread, Worker } from 'threads'
import assert from 'assert-fast'
import git, { TREE, WORKDIR, STAGE } from 'isomorphic-git'
import { posix } from 'path-browserify'
import { toString } from 'uint8arrays/to-string'
import { serializeError } from 'serialize-error'

export default class Runner {
  #artifact
  #opts
  #debuggingOverloads = new Map()
  #workerCache = new Map()
  static create({ artifact, opts }) {
    const runner = new Runner()
    runner.#artifact = artifact
    runner.#opts = opts
    return runner
  }
  // TODO track purging that is due - immdediately after a commit, clear io.
  async start() {
    // TODO subscribe to writes, so we can do internal actions with less commits
    await this.#artifact.subscribeCommits('/hal', async (ref) => {
      // walk for any io.json files
      // see if they changed based on the last commit
      // if so, grab the worker or create one
      // pass the action off
      // update the output to signal invocation
      // wait until long enough has passed or other actions have occured

      const commit = await git.readCommit({ ...this.#opts, oid: ref })
      const { parent } = commit.commit
      const changes = await git.walk({
        ...this.#opts,
        trees: [TREE({ ref }), TREE({ ref: parent[0] })],
        map: async (path, [current, previous]) => {
          if (path.endsWith('.io.json') && current) {
            // TODO use the artifact readio method, to check schema
            const io = JSON.parse(toString(await current.content(), 'utf8'))
            const actions = newActions(io.inputs, previous?.inputs || {})
            return { path, actions, io }
          }
        },
      })

      for (const { actions, io, path } of changes) {
        // TODO handle the isolate changing
        if (!this.#workerCache.has(path)) {
          const {
            isolate: { code, api },
          } = io
          let codePath = code
          if (this.#debuggingOverloads.has(code)) {
            codePath = this.#debuggingOverloads.get(code)
          }
          console.log('spawning', codePath)
          const worker = await spawn(new Worker(codePath))
          this.#workerCache.set(path, { api, worker })
        }
        const { api, worker } = this.#workerCache.get(path)
        for (const { action, id } of actions) {
          for (const [functionName, parameters] of Object.entries(action)) {
            const schema = api[functionName]
            validator(schema)(parameters)
            console.log('calling', functionName, parameters)
            worker[functionName](parameters)
              .then((result) => {
                return this.#artifact.replyIO(path, id, result)
              })
              .catch((error) => {
                return this.#artifact.replyIO(path, id, serializeError(error))
              })
          }
        }
      }
    })
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
