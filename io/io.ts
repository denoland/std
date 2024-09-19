import { Debug } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
import { Pending, PID, Pierce, SolidReply, Solids } from '@/constants.ts'
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
  let pending: Pending | undefined
  let reply: SolidReply | undefined
  if (exe) {
    fs.copyChanges(exe.fs)
    if ('reply' in exe) {
      reply = exe.reply
    } else {
      pending = exe.pending
    }
    // if this request is an internal artifact level request, we need to remove
    // the repo lock atomically along with doing the commit to say we're done
  }

  const { poolKeys, pool } = await db.getPooledActions(fs.pid)

  if (!pool.length && !pending && !reply) {
    log('no pool or pending requests')
    return false
  }

  const solids = await solidify(fs, pool, reply, pending)
  const atomic = db.atomic()
  atomic.deletePool(fs.pid, poolKeys)
  return commit(atomic, solids, fs)
}

export const doAtomicPierce = async (db: DB, fs: FS, pierce: Pierce) => {
  const solids = await solidify(fs, [pierce])
  const atomic = db.atomic()
  return commit(atomic, solids, fs)
}

const commit = async (atomic: Atomic, solids: Solids, fs: FS) => {
  // the moneyshot
  const headChanged = await atomic.updateHead(fs.pid, fs.oid, solids.oid)
  if (!headChanged) {
    log('head changed from %o missed %o', fs.oid, solids.oid)
    return false
  }
  transmit(fs.pid, solids, atomic)
  const deletionsOk = await deleteBranches(solids.deletes, atomic)
  if (!deletionsOk) {
    return false
  }
  const success = await atomic.commit()
  log('commit success %o from %o to %o', success, fs.oid, solids.oid)
  return success
}

const transmit = (pid: PID, solids: Solids, atomic: Atomic) => {
  const { oid, exe, branches, poolables } = solids

  if (exe) {
    const { request, sequence } = exe
    atomic.enqueueExecution(request.target, sequence, oid)
  }
  for (const sequence of branches) {
    atomic.enqueueBranch(oid, pid, sequence)
  }
  for (const poolable of poolables) {
    atomic.addToPool(poolable)
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
  atomic.enqueueExecution(origin.target, originSequence, head)
  const success = await atomic.commit()
  log('branch success %o from %o to %o', success, fs.oid, head)
  return success
}
