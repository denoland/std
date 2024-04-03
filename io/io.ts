import { assert, Debug } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
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
  if (!pool.length && !fs.isChanged) {
    log('no pool or changes')
    return false
  }
  const solids = await solidify(fs, pool)
  atomic.deletePool(poolKeys)

  // the moneyshot
  const headChanged = await atomic.updateHead(fs.pid, fs.commit, solids.commit)
  if (!headChanged) {
    log('head changed from %o missed %o', fs.commit, solids.commit)
    return false
  }
  transmit(fs.pid, solids, atomic)
  const success = await atomic.commit()
  log('commit success %o from %o to %o', success, fs.commit, solids.commit)
  return success
}

const transmit = (pid: PID, solids: Solids, atomic: Atomic) => {
  const { commit, exe, branches, replies, deletes } = solids

  const transmittedReplies = new Set<PID>()
  if (exe) {
    const { request, sequence } = exe
    atomic.enqueueExecution(request, sequence, commit)
  }
  for (const sequence of branches) {
    atomic.enqueueBranch(commit, pid, sequence)
  }
  for (const reply of replies) {
    atomic.addToPool(reply)
    if (!transmittedReplies.has(reply.target)) {
      transmittedReplies.add(reply.target)
      // if one was processed, all were processed ☢️
      atomic.enqueueReply(reply)
    }
  }
  for (const { pid, commit } of deletes) {
    atomic.deleteBranch(pid, commit)
  }
}

export const doAtomicBranch = async (db: DB, fs: FS, sequence: number) => {
  const atomic = db.atomic()
  const { pid, head, origin } = await branch(fs, sequence)
  atomic.createBranch(pid, head)
  const originSequence = 0
  atomic.enqueueExecution(origin, originSequence, head)
  const success = await atomic.commit()
  log('branch success %o from %o to %o', success, fs.commit, head)
  return success
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
