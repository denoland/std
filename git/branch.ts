import last from 'npm:array-last'
import { assert, Debug } from '@utils'
import git from '$git'
import { IFs, PID, PROCTYPE } from '@/constants.ts'
import { SolidRequest } from '@/constants.ts'
import IOChannel from '../io/io-channel.ts'
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
  const io = await IOChannel.load(target, fs, commit)
  await git.branch({ fs, dir: '/', ref, checkout: true, object: commit })

  const sequence = getSequence(target.branches)

  const { isolate, functionName, params, target: source } = io.getRequest(
    sequence,
  )
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
  IOChannel.blank(target, fs, commit)

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
