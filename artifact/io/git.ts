/**
 * @module io/git
 * @description
 * Handles all the operations we want to do with git.  Gets passed in the fs
 * that we want to use each time.
 */

import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import git from '$git'
import { ENTRY_BRANCH, PID, Poolable } from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'

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
const solidifyPool = async (fs: IFs, pool: Poolable[]) => {
  // includes replies both async and sync, dispatches
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
