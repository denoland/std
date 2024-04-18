import { getPoolKeyPrefix } from '@/keys.ts'
import { Debug } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
import { Pending, PID, print, Solids, Splice } from '@/constants.ts'
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
    // if this request is an internal artifact level request, we need to remove
    // the repo lock atomically along with doing the commit to say we're done
  }
  if (!pool.length && !fs.isChanged && !pending) {
    log('no pool or changes')
    return false
  }
  const solids = await solidify(fs, pool, pending)
  atomic.deletePool(poolKeys)

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

  const transmitted = new Set<string>()
  if (exe) {
    const { request, sequence } = exe
    atomic.enqueueExecution(request, sequence, oid)
  }
  for (const sequence of branches) {
    atomic.enqueueBranch(oid, pid, sequence)
  }
  for (const poolable of poolables) {
    atomic.addToPool(poolable)
    const key = getPoolKeyPrefix(poolable.target).join('/')
    if (!transmitted.has(key)) {
      transmitted.add(key)
      // if one was processed, all were processed ☢️
      atomic.enqueuePool(poolable)
    }
  }
}
const deleteBranches = async (deletes: Solids['deletes'], atomic: Atomic) => {
  // TODO broadcast deleted splices
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
  // TODO broadcast the splice out
  const atomic = db.atomic()
  const { pid, head, origin } = await branch(fs, sequence)
  atomic.createBranch(pid, head)
  const originSequence = 0
  atomic.enqueueExecution(origin, originSequence, head)
  const success = await atomic.commit()
  log('branch success %o from %o to %o', success, fs.oid, head)
  return success
}
