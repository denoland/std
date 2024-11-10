import { assert, Debug } from '@utils'
import { Branched, Proctype } from '@/constants.ts'
import { RemoteRequest } from '@/constants.ts'
import IOChannel from '../engine/exe/io-channel.ts'
import { solidify } from './solidify.ts'
import FS from '../snapshots/tip.ts'

const log = Debug('AI:git:branch')

/**
 * Given the fs from the parent branch, create a new branch from the
 * given commit.
 * @param fs the parent fs
 * @param sequence the request sequence number in the parent to branch with
 * @param atomic the atomic transaction object
 */
export const branch = async (fs: FS, sequence: number) => {
  assert(!fs.isChanged, 'Cannot branch from a changed fs')
  assert(sequence >= 0, 'sequence must be a whole number')
  log('branch', sequence, fs.oid)
  const io = await IOChannel.load(fs)
  const pid = io.getBranchPid(sequence)

  const { isolate, functionName, params, deletes } = io.getRequest(sequence)

  const origin: RemoteRequest = {
    isolate,
    functionName,
    params,
    target: pid,
    source: fs.pid,
    sequence,
    proctype: Proctype.enum.SERIAL,
    commit: fs.oid,
  }
  log('origin', origin)
  const branch = fs.branch(pid)
  IOChannel.blank(branch)
  if (deletes) {
    deletes.forEach((d) => branch.delete(d))
  }
  // TODO handle branch exists with an error reply

  const solids = await solidify(branch, [origin])
  assert(solids.exe, 'must have an exe')
  assert(solids.branches.length === 0, 'must have no branches')
  assert(solids.poolables.length === 0, 'must have no poolables')
  assert(solids.deletes.length === 0, 'must have no deletes')
  const branched: Branched = {
    origin: solids.exe.request,
    head: solids.oid,
    pid,
  }
  return branched
}
