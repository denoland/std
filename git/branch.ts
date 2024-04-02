import { assert, Debug } from '@utils'
import { Branched, PROCTYPE } from '@/constants.ts'
import { SolidRequest } from '@/constants.ts'
import IOChannel from '../io/io-channel.ts'
import { solidify } from './mod.ts'
import FS from '@/git/fs.ts'
import { Atomic } from '@/atomic.ts'

const log = Debug('AI:git')

/**
 * Given the fs from the parent branch, create a new branch from the
 * given commit.
 * @param fs the parent fs
 * @param sequence the request sequence number in the parent to branch with
 * @param atomic the atomic transaction object
 */
export default async (fs: FS, sequence: number, atomic: Atomic) => {
  assert(!fs.isChanged, 'fs must not be changed')
  assert(sequence >= 0, 'sequence must be a whole number')
  log('branch', sequence, fs.commit)
  const io = await IOChannel.load(fs)
  const branchPid = io.getBranchPid(sequence)
  atomic.createBranch(branchPid, fs.commit)

  const request = io.getRequest(sequence)
  const { isolate, functionName, params } = request

  const origin: SolidRequest = {
    target: branchPid,
    source: fs.pid,
    sequence,
    isolate,
    functionName,
    params,
    proctype: PROCTYPE.SERIAL,
  }
  log('origin', origin)
  const branch = fs.branch(branchPid)
  IOChannel.blank(branch)

  const solids = await solidify(branch, [origin], atomic)
  assert(solids.request, 'must have a request')
  assert(solids.branches.length === 0, 'must have no branches')
  assert(solids.replies.length === 0, 'must have no replies')
  const branched: Branched = { origin: solids.request, commit: solids.commit }
  return branched
}
