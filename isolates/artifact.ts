import { transcribe } from '@/runners/runner-chat.ts'
import { Debug, fromOutcome } from '@utils'
import Executor from '../exe/exe.ts'
import IOChannel from '../io/io-channel.ts'
import {
  ExeResult,
  IsolateLifecycle,
  isPID,
  isPierceRequest,
  isQueueBranch,
  isQueuePierce,
  isQueueReply,
  isQueueRequest,
  JsonValue,
  PID,
  PierceRequest,
  QueueMessage,
  SolidRequest,
} from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import { doAtomicBranch, doAtomicCommit, doAtomicExecution } from '@io/io.ts'
import DB from '../db.ts'
import FS from '../git/fs.ts'
import { assert } from 'https://deno.land/std@0.203.0/assert/assert.ts'
import { pidFromRepo } from '@/keys.ts'
import { ArtifactCore } from '@/constants.ts'

const log = Debug('AI:artifact')
const repo = {
  type: 'object',
  required: ['repo'],
  properties: {
    repo: {
      type: 'string',
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_]*\/[a-zA-Z0-9][a-zA-Z0-9-_]*$',
    },
  },
}
const pid = {
  type: 'object',
  required: ['account', 'repository', 'branches'],
  additionalProperties: false,
  properties: {
    account: {
      type: 'string',
    },
    repository: {
      type: 'string',
    },
    branches: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
  },
}
const request = {
  type: 'object',
  required: ['isolate'],
  properties: {
    isolate: {
      type: 'string',
    },
    pid,
  },
}

export const api = {
  ping: {
    type: 'object',
    description: 'Check queue processing system is alive',
    properties: {},
  },
  probe: {
    type: 'object',
    description: 'Check if a repo or PID exists',
    additionalProperties: false,
    properties: {
      repo: repo.properties.repo,
      pid: pid,
    },
  },
  init: repo,
  clone: repo,
  pull: repo,
  push: repo,
  rm: repo,
  apiSchema: {
    type: 'object',
    required: ['isolate'],
    properties: {
      isolate: {
        type: 'string',
      },
    },
  },
  pierce: {
    type: 'object',
    required: ['pierce'],
    properties: { pierce: request },
  },
  logs: repo, // TODO use pid
}

export type C = { db: DB; exe: Executor }

/**
 * Reason to keep artifact with an Isolate interface, is so we can control it
 * from within an isolate.
 */
export const functions: ArtifactCore = {
  async ping(params?: { data?: JsonValue; pid?: PID }) {
    log('ping', params)
    // TODO make ping able to do interactions with chains ?
    await Promise.resolve()
    return params?.data
  },
  async pierce({ pierce }: { pierce: PierceRequest }, api: IsolateApi<C>) {
    log('pierce %o %o', pierce.isolate, pierce.functionName)
    assert(isPierceRequest(pierce), 'invalid pierce request')
    const { db } = getContext(api)

    const head = await db.readHead(pierce.target)
    assert(head, 'head not found')

    // not necessary to be atomic, but uses functions on the atomic class
    const atomic = db.atomic()
    atomic.addToPool(pierce)
    atomic.enqueuePierce(pierce)
    await atomic.commit()

    for await (const commit of db.watchHead(pierce.target)) {
      if (commit === head) {
        continue
      }
      const fs = FS.open(pierce.target, commit, db)
      const ioChannel = await IOChannel.read(fs)
      assert(ioChannel, 'io channel not found')
      const outcome = ioChannel.getOutcomeFor(pierce)
      if (outcome) {
        return fromOutcome(outcome)
      }
    }
  },
  async probe(params: { repo?: string; pid?: PID }, api: IsolateApi<C>) {
    let { pid, repo } = params
    if (repo) {
      pid = pidFromRepo(repo)
    }
    assert(isPID(pid), 'invalid params')

    const { db } = getContext(api)
    const head = await db.readHead(pid)
    if (head) {
      return { pid, head }
    }
  },
  async init(params: { repo: string }, api: IsolateApi<C>) {
    const start = Date.now()
    const probe = await functions.probe(params, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }
    const { db } = getContext(api)
    const fs = await FS.init(params.repo, db)
    const { pid, commit: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  },
  async clone(params: { repo: string }, api: IsolateApi<C>) {
    const start = Date.now()
    const { repo } = params
    const probe = await functions.probe({ repo }, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    log('cloning %s', repo)
    const { db } = getContext(api)
    const fs = await FS.clone(repo, db)
    const { pid, commit: head } = fs
    log('cloned', head)
    return { pid, head, elapsed: Date.now() - start }
  },
  pull() {
    throw new Error('not implemented')
  },
  push() {
    throw new Error('not implemented')
  },
  async rm(params: { repo: string }, api: IsolateApi<C>) {
    // TODO lock the whole repo in case something is running
    // TODO maybe have a top level key indicating if the repo is active or not
    // which can get included in the atomic checks for all activities
    const pid = pidFromRepo(params.repo)
    const { db } = getContext(api)
    await db.rm(pid)
  },
  async apiSchema(params: { isolate: string }) {
    const { isolate } = params
    const compartment = await Compartment.create(isolate)
    return compartment.api
  },
  async transcribe(params: { audio: File }) {
    const text = await transcribe(params.audio)
    return { text }
  },
  async logs(params: { repo: string }, api: IsolateApi<C>) {
    // TODO convert logs to a splices query
    log('logs', params.repo)
    const pid = pidFromRepo(params.repo)
    const { db } = getContext(api)
    const fs = await FS.openHead(pid, db)
    const logs = await fs.logs()
    return logs
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    const db = await DB.create()
    const exe = Executor.createCacheContext()
    api.context = { db, exe }
    db.listen(async (message: QueueMessage) => {
      log('queue %o', message)
      if (isQueuePierce(message)) {
        const { pierce } = message

        let tip = await FS.openHead(pierce.target, db)
        while (await db.hasPoolable(pierce)) {
          if (await doAtomicCommit(db, tip)) {
            return
          }
          tip = await FS.openHead(pierce.target, db)
        }
      }
      if (isQueueRequest(message)) {
        log(
          'queue request',
          message.sequence,
          message.commit,
          message.request.target,
        )
        const { request, commit, sequence } = message
        if (await isSettled(request, sequence, db)) {
          return
        }
        const fs = FS.open(request.target, commit, db)
        const exeResult = await exe.execute(request, fs)

        let tip = await FS.openHead(request.target, db)
        while (await isExeable(sequence, tip, exeResult)) {
          if (await doAtomicExecution(db, tip, exeResult)) {
            return
          }
          tip = await FS.openHead(request.target, db)
        }
      }
      if (isQueueBranch(message)) {
        const { parentCommit, parentPid, sequence } = message
        const parentFs = FS.open(parentPid, parentCommit, db)
        const io = await IOChannel.read(parentFs)
        assert(io, 'io not found')
        const branchPid = io.getBranchPid(sequence)

        let head = await db.readHead(branchPid)
        while (!head) {
          if (await doAtomicBranch(db, parentFs, sequence)) {
            return
          }
          head = await db.readHead(branchPid)
        }
      }
      if (isQueueReply(message)) {
        const { reply } = message

        let tip = await FS.openHead(reply.target, db)
        while (await db.hasPoolable(reply)) {
          if (await doAtomicCommit(db, tip)) {
            return
          }
          tip = await FS.openHead(reply.target, db)
        }
      }
    })
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}
const isExeable = async (sequence: number, tip: FS, exe: ExeResult) => {
  const io = await IOChannel.read(tip)
  assert(io, 'io not found')
  if (io.isSettled(sequence)) {
    return false
  }
  if (exe?.pending) {
    return !io.isPendingIncluded(sequence, exe.pending.commit)
  }
  return true
}
const isSettled = async (request: SolidRequest, sequence: number, db: DB) => {
  const tip = await FS.openHead(request.target, db)
  log('isSettled', sequence, tip.pid, tip.commit)
  // log('files', await tip.ls('.'))
  const io = await IOChannel.read(tip)
  assert(io, 'io not found')
  if (io.isSettled(sequence)) {
    return true
  }
  return false
}
const getContext = (api: IsolateApi<C>): C => {
  assert(api.context, 'context not found')
  const { db, exe } = api.context
  assert(db instanceof DB, 'db not found')
  assert(exe, 'exe not found')

  return { db, exe }
}
// TODO remove anyone using atomics except for io
