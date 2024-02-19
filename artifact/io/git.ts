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
  checkPool(pool)
  const api = IsolateApi.create(fs)
  log('solidifyPool')
  let io: IoStruct = { sequence: 0, requests: {}, replies: {} }
  if (await api.exists('.io.json')) {
    io = await api.readJSON('.io.json') as IoStruct
    // TODO check format and schema
    blankSettledRequests(io)
  }
  const requests: Request[] = []
  const branches: PID[] = []
  const replies: Reply[] = []
  let parent
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      const sequence = io.sequence++
      io.requests[sequence] = poolable
      if (poolable.proctype === PROCTYPE.BRANCH) {
        const pid = branchPid(poolable.target, sequence)
        branches.push(pid)
      } else {
        requests.push(poolable)
      }
    } else {
      log('reply', poolable.outcome)
      const { sequence } = poolable
      const request = io.requests[sequence]
      assert(request, `reply sequence not found: ${sequence}`)
      io.replies[sequence] = poolable.outcome
      if (!equal(request.source, request.target)) {
        const reply: Reply = { ...poolable, target: request.source }
        delete reply.commit
        delete reply.fs
        replies.push(reply)
      }
      if (request.proctype === PROCTYPE.BRANCH) {
        assert(poolable.fs, 'branch reply needs fs: ' + sequence)
        assert(poolable.commit, 'branch reply needs commit: ' + sequence)
        // copy in the fs objects into this one
        // add to the parent array
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

  return { commit, requests, branches, replies }
}

/**
 * Given the fs from the parent branch, create a new branch from the
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
  const origin = io.requests[sequence]
  origin.proctype = PROCTYPE.SERIAL
  origin.source = origin.target
  origin.target = pid
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
const checkPool = (pool: Poolable[]) => {
  assert(pool.length > 0, 'empty pool')
  const { target } = pool[0]
  for (const poolable of pool) {
    if (!equal(poolable.target, target)) {
      throw new Error('pool has mixed targets')
    }
    // if the reply comes from a different branch, it needs to be a merge
    // if we had the io input, then we would know if it was a merge without
    // storing any extra info on the reply object itself.

    // check for duplicate items
    // check for out of order serial replies
  }
}
const branchPid = (pid: PID, sequence: number) => {
  const branches = pid.branches.concat(sequence.toString())
  return { ...pid, branches }
}
const branchName = (pid: PID) => {
  return pid.branches.join('-')
}
const copyObjects = (from: IFs, to: IFs) => {
  // TODO read from a specific commit
  // log(print.toTreeSync(from))
  // log(print.toTreeSync(to))

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
