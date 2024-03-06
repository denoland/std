import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { assert, Debug, equal } from '@utils'
import git from '$git'
import { IoStruct, PID, Poolable, PROCTYPE } from '@/artifact/constants.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  isPierceRequest,
  MergeReply,
  PierceReply,
  Reply,
  Request,
  SolidRequest,
} from '@/artifact/constants.ts'

const log = Debug('AI:git')

const dir = '/'
const author = { name: 'IO' }

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
export default async (fs: IFs, pool: Poolable[]) => {
  checkPool(pool)
  // TODO use the head commit to ensure we are reading the right file
  const api = IsolateApi.createFS(fs)
  log('solidifyPool')
  // TODO change this to use the iofile class
  let io: IoStruct = { sequence: 0, requests: {}, replies: {} }
  if (await api.exists('.io.json')) {
    io = await api.readJSON('.io.json') as IoStruct
    // TODO check format and schema
    blankSettledRequests(io)
  }
  const requests: SolidRequest[] = []
  const priors: (number | undefined)[] = []
  // TODO include multiple requests to the same branch as a single array
  const branches: PID[] = []
  const replies: Reply[] = []
  let parent
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.sequence++
      io.requests[sequence] = poolable
      const { proctype } = poolable
      if (proctype === PROCTYPE.BRANCH || proctype === PROCTYPE.BRANCH_OPEN) {
        const pid = branchPid(poolable.target, sequence)
        branches.push(pid)
      } else {
        const request = toInternalRequest(poolable, sequence)
        requests.push(request)
        // TODO dump the prior concept and use an execlock
        // TODO move getPrior to the iofile class
        const prior = getPrior(sequence, io)
        priors.push(prior)
      }
    } else {
      log('reply', poolable.outcome)
      const { sequence } = poolable
      // TODO move this to checkPool()
      assert(Number.isInteger(sequence), 'reply needs a sequence number')
      assert(sequence >= 0, 'reply needs a whole sequence number')
      const request = io.requests[sequence]
      assert(request, `reply sequence not found: ${sequence}`)
      io.replies[sequence] = poolable.outcome
      // if this is a pierce, need to make a reply occur outside
      const { outcome } = poolable
      if (isPierceRequest(request)) {
        const { ulid } = request
        const reply: PierceReply = { ulid, outcome }
        replies.push(reply)
      } else if (!equal(request.source, request.target)) {
        const target = request.source
        const source = request.target
        const commit = ''
        const sequence = request.sequence
        const reply: MergeReply = { target, source, sequence, outcome, commit }
        replies.push(reply)
      }
      if (isBranch(request)) {
        assert(isMergeReply(poolable), 'branch requires merge reply')
        log('branch reply', poolable.commit)
        if (!parent) {
          const head = await git.resolveRef({ fs, dir: '/', ref: 'HEAD' })
          parent = [head]
        }
        parent.push(poolable.commit)
        if (request.proctype === PROCTYPE.BRANCH) {
          const branchName = poolable.source.branches.join('_')
          log('deleteBranch', branchName)
          // TODO when kvgit is online this will be a kv delete
          // await git.deleteBranch({ fs, dir, ref: branchName })
        }
      }
    }
  }

  api.writeJSON('.io.json', io)
  await git.add({ fs, dir: '/', filepath: '.io.json' })
  const commit = await git.commit({ fs, dir, message: 'pool', author, parent })
  log('commitHash', commit)
  for (const reply of replies) {
    if (isMergeReply(reply)) {
      reply.commit = commit
    }
  }

  return { commit, requests, priors, branches, replies }
}

const getPrior = (sequence: number, io: IoStruct) => {
  const keys = Object.keys(io.requests).map(Number)
  keys.sort((a, b) => b - a)
  for (const key of keys) {
    assert(key <= sequence, `out of order sequence: ${key}`)
    if (io.replies[key]) {
      continue
    }
    if (key < sequence) {
      return key
    }
  }
}
const toInternalRequest = (request: Request, sequence: number) => {
  const { isolate, functionName, params, proctype, target } = request
  const source = 'ulid' in request ? target : request.source
  return { isolate, functionName, params, proctype, source, target, sequence }
}
const branchPid = (pid: PID, sequence: number) => {
  const branches = pid.branches.concat(sequence.toString())
  return { ...pid, branches }
}
const blankSettledRequests = (io: IoStruct) => {
  for (const key in io.replies) {
    log('delete', key)
    delete io.requests[key]
  }
  io.replies = {}
}
const isRequest = (poolable: Poolable): poolable is Request => {
  return (poolable as Request).proctype !== undefined
}
const isMergeReply = (poolable: Reply): poolable is MergeReply => {
  return 'commit' in poolable
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
  // TODO a request and a reply with the same id cannot be in the same pool
}
const isBranch = (request: Request) => {
  return request.proctype === PROCTYPE.BRANCH ||
    request.proctype === PROCTYPE.BRANCH_OPEN
}
