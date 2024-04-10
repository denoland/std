import { Debug } from '@utils'
import Executor from '../exe/exe.ts'
import IOChannel from '../io/io-channel.ts'
import {
  C,
  ExeResult,
  IsolateLifecycle,
  isPierceRequest,
  isQueueBranch,
  isQueueExe,
  isQueuePierce,
  isQueueReply,
  PierceRequest,
  print,
  QueueMessage,
  SolidRequest,
} from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import { doAtomicBranch, doAtomicCommit } from '@io/io.ts'
import DB from '../db.ts'
import FS from '../git/fs.ts'
import { assert } from 'https://deno.land/std@0.203.0/assert/assert.ts'

const log = Debug('AI:artifact')

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
  pierce: {
    type: 'object',
    required: ['pierce'],
    properties: { pierce: request },
  },
}
export interface Api {
  pierce: (params: { pierce: PierceRequest }) => Promise<void>
}
/**
 * Reason to keep artifact with an Isolate interface, is so we can control it
 * from within an isolate.
 */
export const functions = {
  async pierce({ pierce }: { pierce: PierceRequest }, api: IsolateApi<C>) {
    log('pierce %o %o', pierce.isolate, pierce.functionName)
    assert(isPierceRequest(pierce), 'invalid pierce request')
    const { db } = sanitizeContext(api)
    // TODO add ulid in here, but make it be repeatable

    // not necessary to be atomic, but uses functions on the atomic class
    const result = await db.atomic()
      .addToPool(pierce)
      .enqueuePierce(pierce)
      .commit()
    assert(result, 'pierce failed')
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    const db = await DB.create()
    const exe = Executor.createCacheContext()
    const context: C = { db, exe }
    api.context = context
    db.listen(async (message: QueueMessage) => {
      if (isQueuePierce(message)) {
        const { pierce } = message
        log('Pierce: %o %s', print(pierce.target), pierce.ulid)
        let tip = await FS.openHead(pierce.target, db)
        while (await db.hasPoolable(pierce)) {
          if (await doAtomicCommit(db, tip)) {
            return
          }
          tip = await FS.openHead(pierce.target, db)
        }
      }
      if (isQueueBranch(message)) {
        const { parentCommit, parentPid, sequence } = message
        log('Branch: %o %s %i', print(parentPid), parentCommit, sequence)
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
        log('MergeReply: %o', print(reply.target), reply.sequence, reply.commit)
        let tip = await FS.openHead(reply.target, db)
        while (await db.hasPoolable(reply)) {
          if (await doAtomicCommit(db, tip)) {
            return
          }
          tip = await FS.openHead(reply.target, db)
        }
      }
      if (isQueueExe(message)) {
        const { request, commit, sequence } = message
        log('Execute: %o', print(request.target), commit, sequence)
        if (await isSettled(request, sequence, db)) {
          return
        }
        const exeResult = await execute(request, commit, context)
        if (!exeResult) { // side effect superceded, so abort
          return
        }

        let tip = await FS.openHead(request.target, db)
        while (await isExeable(sequence, tip, exeResult)) {
          if (await doAtomicCommit(db, tip, exeResult)) {
            return
          }
          tip = await FS.openHead(request.target, db)
        }
      }
    })
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}
const execute = async (request: SolidRequest, commit: string, c: C) => {
  const { db, exe } = c
  let effectsLock: Deno.KvEntry<string> | undefined
  if (request.effect) {
    const abort = new AbortController()
    effectsLock = await db.watchSideEffectsLock(request.target, abort)
  }
  const exeResult = await exe.execute(request, commit, c)
  // last instance always owns the lock
  exeResult.effectsLock = effectsLock
  // how do we remove the repo lock as part of atomic commit ?
  return exeResult
}
// if we are a side effect, then if we are aborted, we should immediately bail
// on everything, including the atomicCommit attempt.

// might need to write something to indicate what sequence number and pid was
// used to do this task, so that things like clone can finish and then fail at
// atomic commit, but the next instance to run doesn't error - should know the
// effect got to the end.
// could pass in the atomic object ?
// would need to be special, just for us, rather than something available to
// others ?
// think thats alright since nobody else can mess with repo structures outside
// of doing commits

const isExeable = async (sequence: number, tip: FS, exe: ExeResult) => {
  const io = await IOChannel.read(tip)
  assert(io, 'io not found')
  if (io.isSettled(sequence)) {
    return false
  }
  if ('pending' in exe) {
    return !io.isPendingIncluded(sequence, exe.pending.commit)
  }
  return true
}
const isSettled = async (request: SolidRequest, sequence: number, db: DB) => {
  const tip = await FS.openHead(request.target, db)
  log('isSettled', print(tip.pid), sequence, tip.commit)
  const io = await IOChannel.read(tip)
  assert(io, 'io not found')
  if (io.isSettled(sequence)) {
    return true
  }
  return false
}
export const sanitizeContext = (api: IsolateApi<C>): C => {
  assert(api.context, 'context not found')
  const { db, exe } = api.context
  assert(db instanceof DB, 'db not found')
  assert(exe, 'exe not found')

  return { db, exe }
}
// TODO remove anyone using atomics except for io
