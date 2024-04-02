import { assert, Debug, equal } from '@utils'
import FS from './fs.ts'
import {
  isMergeReply,
  isPierceRequest,
  isRequest,
  MergeReply,
  Poolable,
  PROCTYPE,
  Reply,
  Request,
  SolidRequest,
  Solids,
} from '@/constants.ts'
import IOChannel from '@io/io-channel.ts'
import { Atomic } from '@/atomic.ts'

const log = Debug('AI:git:solidify')

/**
 * Takes in an unordered collection of operations, and orders them in the
 * .io.json file, then performs a commit.
 * The allowed operations are:
 * - dispatch: an action to be executed serially on this branch.  May be
 *   external or from another branch.
 * - merge: an async result is returning, or an external action is being
 *   inserted into the branch.
 * - reply: a result is being returned from a dispatch after serial execution.
 * @param fs a memfs instance to update
 */
export default async (fs: FS, pool: Poolable[], atomic: Atomic) => {
  const pid = checkPool(pool)
  assert(equal(pid, fs.pid), 'pid mismatch')
  const io = await IOChannel.load(fs)

  const executingRequest = io.getExecutingRequest()
  log('solidifyPool executingRequest', executingRequest)

  // TODO include multiple requests to the same branch as a single array
  const branches: number[] = []
  const replies: MergeReply[] = []
  const parents = []
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.addRequest(poolable)
      const { proctype } = poolable
      if (proctype === PROCTYPE.BRANCH || proctype === PROCTYPE.DAEMON) {
        branches.push(sequence)
      } else {
        assert(proctype === PROCTYPE.SERIAL, `invalid proctype: ${proctype}`)
        // TODO error if two serial relies are received in a single poolrush
      }
    } else {
      log('reply', poolable)
      // TODO move this to checkPool()
      const request = io.reply(poolable)
      const { outcome } = poolable
      if (!isPierceRequest(request) && !equal(request.source, pid)) {
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
          atomic.deleteBranch(branchPid, poolable.commit)
        }
      }
    }
  }

  let request: SolidRequest | undefined
  const next = io.getExecutingRequest()
  if (next && !equal(executingRequest, next)) {
    log('nextExecutingRequest', next)
    request = next
  }
  io.save()

  const { commit } = await fs.writeCommitObject('pool', parents)

  log('head', commit)
  for (const reply of replies) {
    reply.commit = commit
  }
  const solids: Solids = { commit, request, branches, replies }
  if (!io.isAccumulating() && !io.getExecutingRequest()) {
    assert(isActive(branches, replies), 'no active solids - stalled')
  }
  return solids
}

const checkPool = (pool: Poolable[]) => {
  assert(pool.length > 0, 'empty pool')
  const { target } = pool[0]
  for (const poolable of pool) {
    if (!equal(poolable.target, target)) {
      throw new Error('pool has mixed targets')
    }
    // TODO check for out of order serial replies
    // this depends on sequence being part of the reply item
  }
  for (let i = 0; i < pool.length; i++) {
    const poolable = pool[i]
    for (let j = i + 1; j < pool.length; j++) {
      const next = pool[j]
      if (equal(poolable, next)) {
        // TODO check against the current io file too
        const msg = 'duplicate pool items: ' + JSON.stringify(poolable, null, 2)
        throw new Error(msg)
      }
    }
  }
  return target
  // TODO a request and a reply with the same id cannot be in the same pool
}
const isBranch = (request: Request) => {
  return request.proctype === PROCTYPE.BRANCH ||
    request.proctype === PROCTYPE.DAEMON
}
const isActive = (branches: number[], replies: Reply[]) => {
  return branches.length > 0 || replies.length > 0
}
