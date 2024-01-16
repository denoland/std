import { deserializeError } from 'serialize-error'
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
export const defaultBranch = 'main'

export const PROCTYPES = {
  SELF: 'SELF',
  SPAWN: 'SPAWN',
  LOCAL: 'LOCAL',
  REMOTE: 'REMOTE',
}
const IO_PATH = '/.io.json'

export default class IO {
  #artifact
  #opts
  #workerCache = new Map()
  #promises = new Map() // path -> promise ?
  static create({ artifact, opts }) {
    const io = new IO()
    io.#artifact = artifact
    const { fs, dir, cache, trigger } = opts
    io.#opts = { fs, dir, cache, trigger }
    return io
  }
  // TODO track purging that is due - immdediately after a commit, clear io.
  async start() {
    // TODO subscribe to writes, so we can do internal actions with less commits
    await this.#artifact.subscribeCommits('/', async (ref) => {
      debug('io commit triggered', ref.substr(0, 7))
      // TODO handle resetting the IO which would terminate all in progress
      const { io, changes } = await this.#diffChanges(ref)
      if (!changes) {
        return
      }
      const { inputs, outputs } = changes
      const branchName = await git.currentBranch(this.#opts)
      debug('io changes', branchName, inputs.length, outputs.length)
      for (const { input, id } of inputs) {
        const { isolate, name, parameters, proctype } = input
        if (proctype === PROCTYPES.SPAWN) {
          debug('spawn', isolate, name, parameters)
          await this.#spawn({ id, isolate, name, parameters })
        } else if (proctype === PROCTYPES.SELF) {
          debug('self', isolate, name, parameters)
          const { api, worker } = await this.#ensureWorker(isolate)
          const schema = api[name]
          try {
            validator(schema)(parameters)
            const result = await worker.execute(name, parameters)
            debug('self result', result)
            await this.#replyIO({ id, result })
          } catch (errorObj) {
            debug('self error', errorObj)
            const error = serializeError(errorObj)
            return this.#replyIO({ id, error })
          }
        }
      }
      for (const { output, id } of outputs) {
        const { result, error } = output
        const pid = `${branchName}_${id}`
        if (id === 0 && branchName !== defaultBranch) {
          const origin = io.inputs[0]
          return await this.#settleBranch(origin, output)
        }
        const { resolve, reject } = this.#promises.get(pid)
        if (error) {
          reject(deserializeError(error))
        } else {
          resolve(result)
        }
        this.#promises.delete(pid)
      }
    })
  }
  async #settleBranch({ address }, { result, error }) {
    assert(address, 'address is required')
    const { branchName, id } = address
    debug('settleBranch', branchName, id, result, error)

    // checkout the parent branch
    const incoming = await git.currentBranch(this.#opts)
    await git.checkout({ ...this.#opts, ref: branchName })
    const commitResult = await git.commit({
      ...this.#opts,
      message: 'settleBranch',
      author: { name: 'HAL' },
      parent: ['HEAD', incoming],
    })
    await git.deleteBranch({ ...this.#opts, ref: incoming })
    debug('commitResult', commitResult)
    // TODO address this reply to know which commit it came from
    // can let the receiver decide if they want to import changed files
    await this.#replyIO({ id, result, error })
  }
  async #spawn({ id, isolate, name, parameters }) {
    // TODO if the isolate has an init function, call it
    const branchName = await git.currentBranch(this.#opts)
    const action = { isolate, name, parameters, proctype: PROCTYPES.SELF }
    action.address = { branchName, id }

    const [{ oid }] = await git.log({ ...this.#opts, depth: 1 })
    const ref = `${oid}-${id}`
    await git.branch({ ...this.#opts, ref, checkout: true })
    await this.#artifact.delete(IO_PATH)
    const io = await this.readIO()
    const { next } = input(io, action)
    await this.#commitIO(next, 'spawn')
  }
  async #replyIO({ id, result, error }) {
    const io = await this.readIO()
    const { outputs } = io
    assert(!outputs[id], `id ${id} found in outputs`)
    const next = { ...io, outputs: { ...outputs, [id]: { result, error } } }
    await this.#commitIO(next, 'replyIO')
  }
  async #ensureWorker(isolate) {
    assert(!posix.isAbsolute(isolate), `isolate must be relative: ${isolate}`)
    if (!this.#workerCache.has(isolate)) {
      // TODO handle the isolate changing
      // TODO isolate by branch as well as name
      debug('ensureWorker', isolate)
      const worker = ioWorker(this.#artifact)
      const api = await worker.load(isolate)
      this.#workerCache.set(isolate, { api, worker })
      // TODO LRU the cache
    }
    return this.#workerCache.get(isolate)
  }
  async workerApi(isolate) {
    const { api } = await this.#ensureWorker(isolate)
    return api
  }
  async loadWorker(isolate) {
    debug('loadWorker', isolate)
    const worker = ioWorker(this.#opts)
    return await worker.load(isolate)
  }
  async stop() {
    this.#workerCache.clear()
  }
  async dispatch({ isolate, name, parameters, proctype }) {
    const io = await this.readIO()
    const action = { isolate, name, parameters, proctype }
    const { id, next } = input(io, action)
    const branchName = await git.currentBranch(this.#opts)

    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    const pid = `${branchName}_${id}`
    debug('dispatch pid', pid)
    assert(!this.#promises.has(pid), `pid ${pid} already exists`)
    this.#promises.set(pid, { resolve, reject })

    await this.#commitIO(next, 'dispatch')
    return promise
  }
  async readIO() {
    // TODO assert the io file is not dirty
    // TODO check the schema of the IO file
    const empty = {
      sequence: 0,
      inputs: {},
      outputs: {},
    }
    try {
      const raw = await this.#artifact.read(IO_PATH)
      return JSON.parse(raw)
    } catch (e) {
      if (e.code === 'ENOENT') {
        return empty
      }
      throw e
    }
  }
  async #commitIO(io, message) {
    debug('commitIO', message)
    const file = JSON.stringify(io, null, 2)
    await this.#artifact.writeCommit(IO_PATH, file, message)
  }
  async #diffChanges(ref) {
    const commit = await git.readCommit({ ...this.#opts, oid: ref })
    const { parent } = commit.commit
    let io
    const changes = await git.walk({
      ...this.#opts,
      trees: [TREE({ ref }), TREE({ ref: parent[0] })],
      map: async (path, [current, previous]) => {
        if (current && current.type === 'tree') {
          return null
        }
        if (previous && previous.type === 'tree') {
          return null
        }
        if (path === IO_PATH.substring('/'.length) && current) {
          // TODO use the artifact readio method, to check schema
          const currentContent = await current.content()
          io = JSON.parse(toString(currentContent, 'utf8'))
          const previousContent = previous && (await previous.content())
          const previousIo =
            previous && JSON.parse(toString(previousContent, 'utf8'))
          const inputs = newInputs(io.inputs, previousIo?.inputs || {})
          const outputs = newOutputs(io.outputs, previousIo?.outputs || {})
          return { inputs, outputs }
        }
      },
    })
    assert(changes.length < 2, `at most one change: ${changes.length}`)
    return { changes: changes[0], io }
  }
}

const newInputs = (inputs, previous) => {
  const indices = []
  // TODO BUT if you blanked them every commit, no need to diff them ?
  for (const id of Object.keys(inputs)) {
    if (previous[id] && equals(inputs[id], previous[id])) {
      continue
    }
    indices.push(Number.parseInt(id))
  }
  indices.sort((a, b) => a - b)
  return indices.map((id) => ({ input: inputs[id], id }))
}
// TODO merge these two functions together
const newOutputs = (outputs, previous) => {
  const indices = []
  for (const id of Object.keys(outputs)) {
    if (previous[id] && equals(outputs[id], previous[id])) {
      continue
    }
    indices.push(Number.parseInt(id))
  }
  indices.sort((a, b) => a - b)
  return indices.map((id) => ({ output: outputs[id], id }))
}

const input = (io, action) => {
  // if no address, it was a loopback only action
  const { proctype } = action
  assert(PROCTYPES[proctype], `invalid proctype: ${proctype}`)
  const { inputs, outputs } = io
  const id = io.sequence
  // TODO io only contains legitimate json values
  const nextInputs = { ...inputs, [id]: action }
  const sequence = id + 1
  const next = { ...io, sequence, inputs: nextInputs, outputs }
  return { id, next }
}
