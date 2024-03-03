import last from 'npm:array-last'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Debug } from '@utils'
import git from '$git'
import { IoStruct, PID, PROCTYPE } from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import { SolidRequest } from '@/artifact/constants.ts'
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
  const ref = branchName(target)
  log('branch', target, ref)
  // TODO make a shallow checkout by making a custom git tree for commits
  await git.branch({ fs, dir: '/', ref, checkout: true, object: commit })

  const api = IsolateApi.createFS(fs, commit)
  const io = await api.readJSON('.io.json') as IoStruct
  const sequence = Number.parseInt(last(target.branches))

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
  return await solidify(fs, [origin])
}

const branchName = (pid: PID) => {
  return pid.branches.join('-')
}
