import { assert, Debug } from '@utils'
import { PROCTYPE } from '@/constants.ts'
import { isPierceRequest, SolidRequest } from '@/constants.ts'
import IOChannel from '../io/io-channel.ts'
import { solidify } from './mod.ts'
import FS from '@/git/fs.ts'

const log = Debug('AI:git')

/**
 * Given the fs from the parent branch, create a new branch from the
 * given commit.  We assume here that PID lock has been acquired already.
 * @param fs a memfs instance to update
 * @param commit hash of the commit to start the branch from
 * @param target the new branch PID
 */
export default async (fs: FS, sequence: number) => {
  assert(sequence >= 0, 'sequence must be a whole number')
  log('branch', sequence, fs.commit)
  const io = await IOChannel.load(fs)
  const request = io.getRequest(sequence)
  assert(!isPierceRequest(request), 'cannot branch from pierce request')
  const { isolate, functionName, params, target: source } = request

  const name = getBranchName(request, sequence)
  const branch = await fs.branch(name)
  const proctype = PROCTYPE.SERIAL
  const origin: SolidRequest = {
    target: branch.pid,
    source,
    sequence,
    isolate,
    functionName,
    params,
    proctype,
  }
  log('origin', origin)
  IOChannel.blank(branch)

  return await solidify(branch, [origin])
}

export const getBranchName = (request: SolidRequest, sequence: number) => {
  let name = sequence + ''
  if (request.branch) {
    assert(!request.branchPrefix, 'cannot have both branch and branchPrefix')
    name = request.branch
  }
  if (request.branchPrefix) {
    assert(!request.branch, 'cannot have both branch and branchPrefix')
    name = request.branchPrefix + '-' + sequence
  }
  return name
}
