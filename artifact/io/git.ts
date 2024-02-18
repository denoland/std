/**
 * @module io/git
 * @description
 * Handles all the operations we want to do with git.  Gets passed in the fs
 * that we want to use each time.
 */

import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Debug } from '@utils'
import git from '$git'
import { ENTRY_BRANCH, IoStruct, PID, Poolable } from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import { Reply, Request } from '@/artifact/constants.ts'

// else git leaks resources
globalThis.CompressionStream = undefined as unknown as typeof CompressionStream

const log = Debug('AI:git')
// every function call here causes a commit

const dir = '/'

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
  const api = IsolateApi.create(fs)
  log('solidifyPool', pool)
  let io: IoStruct = { sequence: 0, inputs: {}, outputs: {} }
  if (await api.exists('.io.json')) {
    io = await api.readJSON('.io.json') as IoStruct
    // TODO check format and schema
    blankSettledRequests(io)
  }
  for (const poolable of pool) {
    if (isRequest(poolable)) {
      io.inputs[io.sequence++] = poolable
    } else {
      log('reply')
      const { sequence } = poolable
      assert(io.inputs[sequence], `reply sequence not found: ${sequence}`)
      io.outputs[sequence] = poolable.outcome
    }
  }
  api.writeJSON('.io.json', io)
  await git.add({ fs, dir: '/', filepath: '.io.json' })
  const hash = await git.commit({
    fs,
    dir: '/',
    message: 'pool',
    author: { name: 'IO' },
  })
  log('commitHash', hash)
}

/**
 * Is given the fs from the parent branch, and creates a new branch from the
 * given commit.
 * @param fs a memfs instance to update
 * @param commit hash of the commit to start the branch from
 * @param pid the new branch PID
 */
const branch = async (fs: IFs, commit: string, pid: PID) => {
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
