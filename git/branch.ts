import last from 'npm:array-last'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Debug } from '@utils'
import git from '$git'
import { IoStruct, PID, PROCTYPE } from '@/constants.ts'
import { assert } from '$std/assert/assert.ts'
import IsolateApi from '@/isolate-api.ts'
import { SolidRequest } from '@/constants.ts'
import { solidify } from './mod.ts'

const log = Debug('AI:git')

/**
 * Given the fs from the parent branch, create a new branch from the
 * given commit.  We assume here that PID lock has been acquired already.
 * @param fs a memfs instance to update
 * @param commit hash of the commit to start the branch from
 * @param target the new branch PID
 */
export default async (fs: IFs, commit: string, target: PID) => {
  assert(target.branches.length > 1, 'cannot branch into base branch')
  const ref = getBranchName(target)
  log('branch', target, ref)
  // TODO make a shallow checkout by making a custom git tree for commits
  await git.branch({ fs, dir: '/', ref, checkout: true, object: commit })

  const api = IsolateApi.createFS(fs, commit)
  const io = await api.readJSON('.io.json') as IoStruct
  const sequence = getSequence(target.branches)

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
  return await solidify(fs, [origin], commit)
}

export const getBranchName = (pid: PID) => {
  return pid.branches.join('_')
}
const getSequence = (branches: string[]) => {
  const lastBranch = last(branches)
  if (!Number.isInteger(lastBranch)) {
    // rule is that all branches must end with the sequence number
    const aliases = lastBranch.split('-')
    return Number.parseInt(last(aliases))
  }
  return Number.parseInt(last(branches))
}
