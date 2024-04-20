import { assert, Debug, equal } from '@utils'
import FS from './fs.ts'
import {
  isMergeReply,
  isPierceRequest,
  MergeReply,
  Pending,
  PID,
  PierceRequest,
  Poolable,
  PROCTYPE,
  RemoteRequest,
  Request,
  SolidRequest,
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
 */
export const solidify = async (fs: FS, pool: Poolable[], pending?: Pending) => {
  assert(pool.length > 0 || fs.isChanged || pending?.requests.length, 'no-op')
  checkPool(pool)
  const io = await IOChannel.load(fs)

  const executingRequest = io.getCurrentSerialRequest()
  log('solidifyPool executingRequest', executingRequest)

  const branches: number[] = []
  const poolables: (MergeReply | RemoteRequest)[] = []
  const parents = []
  const deletes = []

  if (pending) {
    assert(pending.requests.length, 'cannot be pending without requests')
    log('solidifyPool pending', pending)
    const { commit, requests, sequence } = pending
    const sequenced = io.addPending(sequence, commit, requests)
    sequenced.forEach((r) => {
      if (equal(r.target, fs.pid)) {
        collectBranch(r, r.sequence, branches)
      } else {
        const remoteRequest = { ...r, commit: 'updated post commit' }
        poolables.push(remoteRequest)
      }
    })
  }

  for (const poolable of pool) {
    if (isMergeReply(poolable)) {
      log('reply', poolable)
      const request = io.reply(poolable)
      if (!equal(request.target, fs.pid)) {
        parents.push(poolable.commit)
      }

      const { outcome } = poolable
      if (!isPierceRequest(request)) {
        if (!equal(request.source, fs.pid)) {
          const target = request.source
          const source = request.target
          const sequence = request.sequence
          const commit = 'updated post commit'
          const reply: MergeReply = {
            target,
            source,
            sequence,
            outcome,
            commit,
          }
          poolables.push(reply)
        }
      }
      if (isBranch(request, fs.pid)) {
        assert(isMergeReply(poolable), 'branch requires merge reply')
        log('branch reply', poolable.commit)
        if (request.proctype === PROCTYPE.BRANCH) {
          const { sequence } = poolable
          const branchPid = io.getBranchPid(sequence)
          deletes.push({ pid: branchPid, commit: poolable.commit })
        }
      }
    } else {
      const sequence = io.addRequest(poolable)
      collectBranch(poolable, sequence, branches)
    }
  }
  if (pool.length || pending) {
    io.save()
  }

  let exe: Solids['exe']
  const nextRequest = io.getCurrentSerialRequest()
  if (nextRequest && !equal(executingRequest, nextRequest)) {
    const sequence = io.getSequence(nextRequest)
    exe = { request: nextRequest, sequence }
  }
  // TODO pass in all the db checks to go with this write
  // TODO write blobs atomically
  const { next, changes, commit } = await fs.writeCommitObject('pool', parents)
  log('head', commit)
  for (const poolable of poolables) {
    poolable.commit = next.oid
  }

  const solids: Solids = {
    oid: next.oid,
    commit,
    changes,
    exe,
    branches,
    poolables,
    deletes,
  }
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
const isBranch = (request: SolidRequest | PierceRequest, thisPid: PID) => {
  if (!isPierceRequest(request)) {
    if (!equal(request.target, thisPid)) {
      return false
    }
  }
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
