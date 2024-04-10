import { assert, Debug, equal } from '@utils'
import FS from './fs.ts'
import {
  isMergeReply,
  isPierceRequest,
  isRequest,
  MergeReply,
  Pending,
  Poolable,
  PROCTYPE,
  Request,
  Solids,
} from '@/constants.ts'
import IOChannel from '@io/io-channel.ts'

const log = Debug('AI:git:solidify')

/**
 * Takes in an unordered collection of operations, and orders them in the
 * .io.json file, then performs a commit.
 * The allowed operations are:
 * - execute: an action to be executed serially on this branch.  May be
 *   external or from another branch.
 * - branch: a new branch is being created with an origin action to be executed.
 * - merge: an async result is returning, or an external action is being
 *   inserted into the branch.
 * - reply: a result is being returned from a dispatch after serial execution.
 * @param fs a memfs instance to update
 */
export const solidify = async (fs: FS, pool: Poolable[], pending?: Pending) => {
  assert(pool.length > 0 || fs.isChanged || pending?.requests.length, 'no-op')
  checkPool(pool)
  const io = await IOChannel.load(fs)

  const executingRequest = io.getNextSerialRequest()
  log('solidifyPool executingRequest', executingRequest)

  const branches: number[] = []
  const replies: MergeReply[] = []
  const parents = []
  const deletes = []

  if (pending) {
    assert(pending.requests.length, 'cannot be pending without requests')
    log('solidifyPool pending', pending)
    const { commit, requests } = pending
    const sequenced = io.addPending(commit, requests)
    sequenced.forEach((r) => collectBranch(r, r.sequence, branches))
  }

  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.addRequest(poolable)
      collectBranch(poolable, sequence, branches)
    } else {
      log('reply', poolable)
      const request = io.reply(poolable)
      const { outcome } = poolable
      if (!isPierceRequest(request) && !equal(request.source, fs.pid)) {
        const target = request.source
        const source = request.target
        const sequence = request.sequence
        const commit = 'updated post commit'
        const reply: MergeReply = { target, source, sequence, outcome, commit }
        replies.push(reply)
      }
      if (isBranch(request)) {
        assert(isMergeReply(poolable), 'branch requires merge reply')
        log('branch reply', poolable.commit)
        parents.push(poolable.commit)
        if (request.proctype === PROCTYPE.BRANCH) {
          const { sequence } = poolable
          const branchPid = io.getBranchPid(sequence)
          deletes.push({ pid: branchPid, commit: poolable.commit })
        }
      }
    }
  }
  if (pool.length || pending) {
    io.save()
  }

  let exe: Solids['exe']
  const next = io.getNextSerialRequest()
  if (next && !equal(executingRequest, next)) {
    log('nextExecutingRequest', next)
    const sequence = io.getSequence(next)
    exe = { request: next, sequence }
  }
  // TODO pass in all the db checks to go with this write
  // possibly the writing of the blobs can be part of the atomics too
  const { commit } = await fs.writeCommitObject('pool', parents)

  log('head', commit)
  for (const reply of replies) {
    reply.commit = commit
  }
  const solids: Solids = { commit, exe, branches, replies, deletes }
  return solids
}

const checkPool = (pool: Poolable[]) => {
  if (!pool.length) {
    return
  }
  const { target } = pool[0]
  for (const poolable of pool) {
    if (!equal(poolable.target, target)) {
      throw new Error('pool has mixed targets')
    }
  }
  // TODO use a hash on poolables to determine uniqueness in the pool
  return target
  // TODO a request and a reply with the same id cannot be in the same pool
}
const isBranch = (request: Request) => {
  return request.proctype === PROCTYPE.BRANCH ||
    request.proctype === PROCTYPE.DAEMON
}
const collectBranch = (req: Request, sequence: number, branches: number[]) => {
  const { proctype } = req
  if (proctype === PROCTYPE.BRANCH || proctype === PROCTYPE.DAEMON) {
    branches.push(sequence)
  } else {
    assert(proctype === PROCTYPE.SERIAL, `invalid proctype: ${proctype}`)
  }
}
