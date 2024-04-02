import * as git from '../git/mod.ts'
import { assert, Debug } from '@utils'
import { PID, SolidReply, Solids } from '@/constants.ts'
import DB from '@/db.ts'
import FS from '@/git/fs.ts'
import IOChannel from '@/io/io-channel.ts'
import { Atomic } from '@/atomic.ts'
import { ExeResult } from '@/constants.ts'
const log = Debug('AI:io')

/**
 * Inducting is the act of pulling in this poolable and any others that are in
 * the pool.  If this operation fails due to head mismatch, we can assume that
 * the poolable has been processed since any competing process would have
 * gathered all the poolable items.  This is a form of optimistic concurrency.
 *
 * If a reply is supplied, then we MUST induct, since we have changed files on
 * the fs that need to be included in the commit.
 */
export const doAtomicCommit = async (db: DB, fs: FS, reply?: SolidReply) => {
  const atomic = db.atomic()
  const { poolKeys, pool } = await db.getPooledActions(fs.pid)
  if (reply) {
    pool.unshift(reply)
  }
  if (!pool.length) {
    return false
  }
  const solids = await git.solidify(fs, pool, atomic)
  atomic.deletePool(poolKeys)

  // the moneyshot
  atomic.updateHead(fs.pid, fs.commit, solids.commit)
  transmit(fs.pid, solids, atomic)
  return await atomic.commit()
}

const transmit = (pid: PID, solids: Solids, atomic: Atomic) => {
  log('solids %o', solids)
  const { commit, request, branches, replies } = solids

  const transmittedReplies = new Set<PID>()
  if (request) {
    log('request %o', request)
    atomic.enqueueExecution(request, commit)
  }
  for (const sequence of branches) {
    log('branch %o', sequence)
    atomic.enqueueBranch(commit, pid, sequence)
  }
  for (const reply of replies) {
    log('solid reply %o', reply)
    atomic.addToPool(reply)
    if (!transmittedReplies.has(reply.target)) {
      transmittedReplies.add(reply.target)
      // if one was processed, all were processed ☢️
      atomic.enqueueReply(reply)
    }
  }
}

export const doAtomicBranch = async (db: DB, fs: FS, sequence: number) => {
  const atomic = db.atomic()
  const { origin, commit } = await git.branch(fs, sequence, atomic)
  atomic.enqueueExecution(origin, commit)
  return await atomic.commit()
}

// TODO move all these types to share a file with their tests for done

export const doAtomicExecution = async (db: DB, tip: FS, exe: ExeResult) => {
  if (exe.settled) {
    const { reply, fs } = exe.settled
    tip.copyChanges(fs)
    return await doAtomicCommit(db, tip, reply)
  } else {
    assert(exe.pending, 'if not settled, must be pending')
    const { commit, requests } = exe.pending
    const io = await IOChannel.load(tip)
    io.addPending(commit, requests)
    io.save()
    return await doAtomicCommit(db, tip) // TODO ensure that the pool can be empty if there are file changes
  }
}
