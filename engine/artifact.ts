import { assert, Debug } from '@utils'
import Executor from '../../engine/exe/exe.ts'
import IOChannel from '../../engine/io/io-channel.ts'
import {
  ExeResult,
  freezePid,
  Functions,
  IsolateLifecycle,
  isPierceRequest,
  isQueueBranch,
  isQueueExe,
  isQueuePool,
  PID,
  pierceSchema,
  print,
  QueueMessage,
  ToApiType,
} from '@/constants.ts'
import IA from '../../execution/napp-api.ts'
import { doAtomicBranch, doAtomicCommit, doAtomicPierce } from '@io/io.ts'
import DB from '../db.ts'
import FS from '../../engine/git/fs.ts'
import { z } from 'zod'
const log = Debug('AI:artifact')

/** Artifact Context, including the db and executor */
export type C = {
  db: DB
  exe: Executor
  aesKey?: string
  seed?: Deno.KvEntry<unknown>[]
}

export const parameters = { pierce: z.object({ pierce: pierceSchema }) }
export const returns = { pierce: z.void() }

export type Api = ToApiType<typeof parameters, typeof returns>

/**
 * Reason to keep artifact with an Isolate interface, is so we can control it
 * from within an isolate.
 */
export const functions: Functions<Api> = {
  async pierce({ pierce }, api: IA<C>) {
    assert(isPierceRequest(pierce), 'invalid pierce request')
    log('pierce %o %o', pierce.isolate, pierce.functionName)
    log('target', print(pierce.target))
    freezePid(pierce.target)
    const { db } = sanitizeContext(api)
    // TODO add ulid in here, but make it be repeatable
    // TODO check signatures and permissions here

    let isPierced = false
    let count = 0
    while (!isPierced && count < 100) {
      count++
      const tip = await FS.openHead(pierce.target, db)

      isPierced = await doAtomicPierce(db, tip, pierce)
    }
    if (!isPierced) {
      throw new Error(`pierce failed after ${count} attempts`)
    }
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IA<C>) {
    const { aesKey, seed } = api.context
    assert(aesKey, 'AES_KEY not found')
    const db = await DB.create(aesKey, seed)
    const exe = Executor.createCacheContext()
    const context: C = { db, exe }
    api.context = context
    assert(!api.context.aesKey, 'AES_KEY leaked')
    assert(!api.context.seed, 'seed leaked')

    db.listen(async (message: QueueMessage) => {
      if (isQueuePool(message)) {
        const { pid } = message
        logger('qpl', pid)(print(pid))
        do {
          // TODO catch head not found and reject all poolables to error reply
          const tip = await FS.openHead(pid, db)
          await doAtomicCommit(db, tip)
        } while (await db.hasPoolables(pid))
      }
      if (isQueueBranch(message)) {
        const { parentCommit, parentPid, sequence } = message
        log('Branch: %s %s %i', print(parentPid), parentCommit, sequence)
        const parentFs = FS.open(parentPid, parentCommit, db)
        const io = await IOChannel.read(parentFs)
        assert(io, 'io not found')
        const branchPid = io.getBranchPid(sequence)
        logger('qbr')(print(branchPid), sequence)

        let head = await db.readHead(branchPid)
        // TODO if head already exists and we did not create it, error
        while (!head) {
          // TODO should do the atomic branch first, then check the head after
          // if failed
          if (await doAtomicBranch(db, parentFs, sequence)) {
            return
          }
          head = await db.readHead(branchPid)
        }
      }
      if (isQueueExe(message)) {
        const { pid, commit, sequence } = message
        logger('qex', pid)(commit, sequence)
        if (await isSettled(pid, sequence, db)) {
          return
        }
        const exeResult = await execute(pid, commit, sequence, context)
        if (!exeResult) { // side effect superseded, so abort
          return
        }
        let tip = await FS.openHead(pid, db)
        while (await isExeable(sequence, tip, exeResult)) {
          if (await doAtomicCommit(db, tip, exeResult)) {
            return
          }
          tip = await FS.openHead(pid, db)
        }
      }
    })
  },
  '@@unmount'(api: IA<C>) {
    const { db } = sanitizeContext(api)
    return db.stop()
  },
}
const execute = async (pid: PID, commit: string, sequence: number, c: C) => {
  const { db, exe } = c
  let effectsLock: Deno.KvEntry<string> | undefined

  const io = await IOChannel.read(FS.open(pid, commit, db))
  assert(io, 'io not found')
  const request = io.getRequest(sequence)

  if (request.effect) {
    const abort = new AbortController()
    effectsLock = await db.watchSideEffectsLock(pid, abort)
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
const isSettled = async (pid: PID, sequence: number, db: DB) => {
  const tip = await FS.openHead(pid, db)
  log('isSettled', print(tip.pid), sequence, tip.oid)
  const io = await IOChannel.read(tip)
  if (!io) {
    return false
  }
  // TODO might be able to merge this with the execution retrieval ?
  if (io.isSettled(sequence)) {
    return true
  }
  return false
}
export const sanitizeContext = (api: IA<C>): C => {
  assert(api.context, 'context not found')
  const { db, exe } = api.context
  assert(db instanceof DB, 'db not found')
  assert(exe, 'exe not found')

  return { db, exe }
}
// TODO remove anyone using atomics except for io
const logger = (prefix: string, pid?: PID) => {
  const suffix = pid ? ':' + print(pid) : ''
  const string = 'AI:' + prefix + suffix
  if (!loggerCache.has(string)) {
    const logger = Debug(string)
    loggerCache.set(string, logger)
  }
  const logger = loggerCache.get(string)
  assert(logger, 'logger not found')
  return logger
}
const loggerCache = new Map<string, (...args: unknown[]) => void>()
