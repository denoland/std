/**
 * @module io/git
 * @description
 * Handles all the operations we want to do with git.  Gets passed in the fs
 * that we want to use each time.  Every function call here causes a commit
 */
import { equal } from 'https://deno.land/x/equal/mod.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Debug } from '@utils'
import git from '$git'
import {
  ENTRY_BRANCH,
  InternalReply,
  IoStruct,
  PID,
  Poolable,
  PROCTYPE,
} from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import { Reply, Request } from '@/artifact/constants.ts'
import { PierceRequest } from '@/artifact/constants.ts'
import { PierceReply } from '@/artifact/constants.ts'
import { MergeReply } from '@/artifact/constants.ts'
import { SolidRequest } from '@/artifact/constants.ts'

const log = Debug('AI:git')

const dir = '/'
const author = { name: 'IO' }

export const init = async (fs: IFs, repo: string) => {
  const [account, repository] = repo.split('/')
  const pid: PID = { account, repository, branches: [ENTRY_BRANCH] }
  assert(!fs.existsSync(dir + '.git'), 'fs already exists')

  await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })
  return pid
}

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
export const solidifyPool = async (fs: IFs, pool: Poolable[]) => {
  checkPool(pool)
  const api = IsolateApi.createFS(fs)
  log('solidifyPool')
  let io: IoStruct = { sequence: 0, requests: {}, replies: {} }
  if (await api.exists('.io.json')) {
    io = await api.readJSON('.io.json') as IoStruct
    // TODO check format and schema
    blankSettledRequests(io)
  }
  const requests: SolidRequest[] = []
  const priors: (number | undefined)[] = []
  const branches: PID[] = []
  const replies: (PierceReply | InternalReply)[] = []
  let parent
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.sequence++
      io.requests[sequence] = poolable
      if (poolable.proctype === PROCTYPE.BRANCH) {
        const pid = branchPid(poolable.target, sequence)
        branches.push(pid)
      } else {
        const request = toInternalRequest(poolable, sequence)
        requests.push(request)
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
        const reply: InternalReply = { target, sequence, outcome }
        replies.push(reply)
      }
      if (request.proctype === PROCTYPE.BRANCH) {
        assert(isMergeReply(poolable), 'branch reply needs fs and commit')
        if (!parent) {
          const head = await git.resolveRef({ fs, dir: '/', ref: 'HEAD' })
          parent = [head]
        }
        copyObjects(poolable.fs, fs)
        parent.push(poolable.commit)
      }
    }
  }

  api.writeJSON('.io.json', io)
  await git.add({ fs, dir: '/', filepath: '.io.json' })
  const commit = await git.commit({ fs, dir, message: 'pool', author, parent })
  log('commitHash', commit)

  return { commit, requests, priors, branches, replies }
}

/**
 * Given the fs from the parent branch, create a new branch from the
 * given commit.  We assume here that PID lock has been acquired already.
 * @param fs a memfs instance to update
 * @param commit hash of the commit to start the branch from
 * @param target the new branch PID
 */
export const branch = async (fs: IFs, commit: string, target: PID) => {
  assert(target.branches.length > 1, 'cannot branch into base branch')
  const ref = branchName(target)
  log('branch', target, ref)
  await git.branch({ fs, dir: '/', ref, checkout: true, object: commit })

  const api = IsolateApi.createFS(fs, commit)
  const io = await api.readJSON('.io.json') as IoStruct
  const sequence = Number.parseInt(target.branches.slice(-1)[0])

  const { isolate, functionName, params, target: source } =
    io.requests[sequence]
  const proctype = PROCTYPE.SERIAL
  const origin: SolidRequest = {
    target,
    source,
    sequence,
    isolate,
    functionName,
    params,
    proctype,
  }
  log('origin', origin)
  await api.rm('.io.json')
  return await solidifyPool(fs, [origin])
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
const isPierceRequest = (poolable: Request): poolable is PierceRequest => {
  return !!(poolable as PierceRequest).ulid
}
const isMergeReply = (poolable: Reply): poolable is MergeReply => {
  return !!(poolable as MergeReply).fs && !!(poolable as MergeReply).commit
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
const branchPid = (pid: PID, sequence: number) => {
  const branches = pid.branches.concat(sequence.toString())
  return { ...pid, branches }
}
const branchName = (pid: PID) => {
  return pid.branches.join('-')
}
const copyObjects = (from: IFs, to: IFs) => {
  const base = '/.git/objects/'
  from.readdirSync(base).forEach((dir) => {
    if (dir === 'pack' || dir === 'info') {
      return
    }
    const files = from.readdirSync(base + dir)
    files.forEach((file) => {
      const filepath = base + dir + '/' + file
      if (to.existsSync(filepath)) {
        return
      }
      const contents = from.readFileSync(filepath)
      to.mkdirSync('/.git/objects/' + dir, { recursive: true })
      to.writeFileSync(filepath, contents)
    })
  })
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
