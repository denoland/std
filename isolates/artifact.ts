import { assert, Debug } from '@utils'
import Executor from '../exe/exe.ts'
import IOChannel from '../io/io-channel.ts'
import {
  C,
  ExeResult,
  freezePid,
  isMergeReply,
  IsolateLifecycle,
  isPierceRequest,
  isQueueBranch,
  isQueueExe,
  isQueuePool,
  PID,
  PierceRequest,
  Poolable,
  print,
  QueueMessage,
  SolidRequest,
} from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import { doAtomicBranch, doAtomicCommit } from '@io/io.ts'
import DB from '../db.ts'
import FS from '../git/fs.ts'
import { pid } from './repo.ts'
const log = Debug('AI:artifact')

const request = {
  type: 'object',
  required: ['isolate', 'functionName', 'params', 'proctype', 'target', 'ulid'],
  properties: {
    isolate: { type: 'string' },
    functionName: { type: 'string' },
    params: { type: 'object' },
    proctype: { enum: ['SERIAL', 'DAEMON', 'BRANCH'] },
    target: pid.properties.pid,
    ulid: { type: 'string' },
    branch: { type: 'string' },
    branchPrefix: { type: 'string' },
    effect: {
      oneOf: [
        { type: 'boolean' },
        {
          type: 'object',
          properties: {
            net: { type: 'boolean' },
            files: { type: 'boolean' },
            artifact: { type: 'boolean' },
            timeout: { type: 'number' },
          },
        },
      ],
    },
  },
  additionalProperties: false,
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
    freezePid(pierce.target)
    const { db } = sanitizeContext(api)
    // TODO add ulid in here, but make it be repeatable
    // TODO check signatures and permissions here
    // not necessary to be atomic, but uses functions on the atomic class
    const result = await db.atomic()
      .addToPool(pierce)
      .enqueuePool(pierce)
      .commit()
    assert(result, 'pierce failed')
    // TODO return back the head commit at the point of pooling
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    const db = await DB.create()
    const exe = Executor.createCacheContext()
    const context: C = { db, exe }
    api.context = context
    db.listen(async (message: QueueMessage) => {
      if (isQueuePool(message)) {
        const { poolable } = message
        logger('qpl', poolable.target)(commitish(poolable))
        while (await db.hasPoolable(poolable)) {
          const tip = await FS.openHead(poolable.target, db)
          if (await doAtomicCommit(db, tip)) {
            return
          }
        }
      }
      if (isQueueBranch(message)) {
        const { parentCommit, parentPid, sequence } = message
        log('Branch: %o %s %i', print(parentPid), parentCommit, sequence)
        const parentFs = FS.open(parentPid, parentCommit, db)
        const io = await IOChannel.read(parentFs)
        assert(io, 'io not found')
        const branchPid = io.getBranchPid(sequence)
        logger('qbr', parentPid)(parentCommit, sequence, print(branchPid))

        let head = await db.readHead(branchPid)
        while (!head) {
          if (await doAtomicBranch(db, parentFs, sequence)) {
            return
          }
          head = await db.readHead(branchPid)
        }
      }
      if (isQueueExe(message)) {
        const { request, commit, sequence } = message
        logger('qex', request.target)(commit, sequence, request.functionName)
        if (await isSettled(request, sequence, db)) {
          return
        }
        const exeResult = await execute(request, commit, context)
        if (!exeResult) { // side effect superseded, so abort
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
  // TODO release the repo lock as part of atomic commit
  return exeResult
}

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
  log('isSettled', print(tip.pid), sequence, tip.oid)
  const io = await IOChannel.read(tip)
  if (!io) {
    return false
  }
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
const logger = (prefix: string, pid: PID) => {
  const string = 'AI:' + prefix + ':' + print(pid)
  if (!loggerCache.has(string)) {
    const logger = Debug(string)
    loggerCache.set(string, logger)
  }
  const logger = loggerCache.get(string)
  assert(logger, 'logger not found')
  return logger
}
const loggerCache = new Map<string, (...args: unknown[]) => void>()
const commitish = (poolable: Poolable) => {
  if ('ulid' in poolable) {
    return poolable.ulid
  }
  if (isMergeReply(poolable)) {
    return 'reply ' + poolable.commit
  }
  return 'request ' + poolable.commit
}
