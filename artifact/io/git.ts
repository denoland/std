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
  IoStruct,
  PID,
  Pierce,
  Poolable,
  PROCTYPE,
} from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import { Reply, Request } from '@/artifact/constants.ts'

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
  const target = checkPool(pool)
  const api = IsolateApi.create(fs)
  log('solidifyPool')
  let io: IoStruct = { sequence: 0, inputs: {}, outputs: {} }
  if (await api.exists('.io.json')) {
    io = await api.readJSON('.io.json') as IoStruct
    // TODO check format and schema
    blankSettledRequests(io)
  }
  const branches: PID[] = []
  const replies: Reply[] = []
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.sequence++
      io.inputs[sequence] = poolable
      if (poolable.proctype === PROCTYPE.BRANCH) {
        const pid = branchPid(poolable.target, sequence)
        branches.push(pid)
      }
    } else {
      log('reply', poolable.outcome)
      const { sequence } = poolable
      const request = io.inputs[sequence]
      assert(request, `reply sequence not found: ${sequence}`)
      io.outputs[sequence] = poolable.outcome
      if (!equal(request.source, request.target)) {
        log('request', request)
        const reply: Reply = { ...poolable, target: request.source }
        replies.push(reply)
      }
    }
  }

  api.writeJSON('.io.json', io)
  await git.add({ fs, dir: '/', filepath: '.io.json' })
  const commit = await git.commit({ fs, dir: '/', message: 'pool', author })
  log('commitHash', commit)

  // if we are closed, delete this branch
  await maybeCloseBranch(target, fs, io)

  // return a list of pids that need to be created from this commit
  return { commit, branches, replies }
}

/**
 * Is given the fs from the parent branch, and creates a new branch from the
 * given commit.  We assume here that PID lock has been acquired already.
 * @param fs a memfs instance to update
 * @param commit hash of the commit to start the branch from
 * @param pid the new branch PID
 */
export const branch = async (fs: IFs, commit: string, pid: PID) => {
  assert(pid.branches.length > 1, 'cannot branch into base branch')
  const ref = branchName(pid)
  log('branch', pid, ref)
  await git.branch({ fs, dir: '/', ref, checkout: true, object: commit })

  const api = IsolateApi.create(fs)
  const io = await api.readJSON('.io.json') as IoStruct
  const sequence = pid.branches.slice(-1)[0]
  const origin = io.inputs[sequence]
  origin.proctype = PROCTYPE.SERIAL
  origin.source = origin.target
  origin.target = pid
  log('origin', origin)
  await api.rm('.io.json')
  await solidifyPool(fs, [origin])
}

const blankSettledRequests = (io: IoStruct) => {
  for (const key in io.outputs) {
    log('delete', key)
    delete io.inputs[key]
  }
  io.outputs = {}
}
const isRequest = (poolable: Poolable): poolable is Request => {
  return (poolable as Request).proctype !== undefined
}
const checkPool = (pool: Poolable[]) => {
  assert(pool.length > 0, 'empty pool')
  const { target } = pool[0]
  assert(pool.every((p) => equal(p.target, target)), 'pool has mixed targets')
  for (const poolable of pool) {
    // check for duplicate items
    // check for out of order serial replies
  }
  return target
}
const branchPid = (pid: PID, sequence: number) => {
  const branches = pid.branches.concat(sequence.toString())
  return { ...pid, branches }
}
const branchName = (pid: PID) => {
  return pid.branches.join('-')
}
const maybeCloseBranch = async (
  target: PID | Pierce,
  fs: IFs,
  io: IoStruct,
) => {
  if ('nonce' in target) {
    return
  }
  const isOriginClosed = !!io.outputs[0]
  if (isOriginClosed) {
    log('closeBranch', branchName(target))
    await git.deleteBranch({ fs, dir, ref: branchName(target) })
  }
}
