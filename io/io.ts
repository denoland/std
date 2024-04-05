import { Debug } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
import { Pending, PID, Solids } from '@/constants.ts'
import DB from '@/db.ts'
import FS from '@/git/fs.ts'
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
export const doAtomicCommit = async (db: DB, fs: FS, exe?: ExeResult) => {
  const atomic = db.atomic()
  const { poolKeys, pool } = await db.getPooledActions(fs.pid)
  let pending: Pending | undefined
  if (exe) {
    if ('settled' in exe) {
      fs.copyChanges(exe.settled.fs)
      pool.unshift(exe.settled.reply)
    } else {
      pending = exe.pending
    }
  }
  if (!pool.length && !fs.isChanged && !pending) {
    log('no pool or changes')
    return false
  }
  const solids = await solidify(fs, pool, pending)
  atomic.deletePool(poolKeys)

  // the moneyshot
  const headChanged = await atomic.updateHead(fs.pid, fs.commit, solids.commit)
  if (!headChanged) {
    log('head changed from %o missed %o', fs.commit, solids.commit)
    return false
  }
  transmit(fs.pid, solids, atomic)
  const deletionsOk = await deleteBranches(solids.deletes, atomic)
  if (!deletionsOk) {
    return false
  }
  const success = await atomic.commit()
  log('commit success %o from %o to %o', success, fs.commit, solids.commit)
  return success
}

const transmit = (pid: PID, solids: Solids, atomic: Atomic) => {
  const { commit, exe, branches, replies } = solids

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
}
const deleteBranches = async (deletes: Solids['deletes'], atomic: Atomic) => {
  const promises = []
  for (const { pid, commit } of deletes) {
    promises.push(atomic.deleteBranch(pid, commit))
  }
  const results = await Promise.all(promises)
  if (results.some((r) => !r)) {
    return false
  }
  return true
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

// basically we need to do a transmit of the new inducted accumulations
