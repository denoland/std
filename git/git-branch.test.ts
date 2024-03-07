import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { assert, expect, log, merge } from '@utils'
import * as git from './mod.ts'
import {
  IoStruct,
  isMergeReply,
  isPierceReply,
  MergeReply,
  PID,
  PierceRequest,
  PROCTYPE,
  Reply,
} from '@/constants.ts'
import gitCommand from '$git'
import FS from '@/fs.ts'

Deno.test('pierce branch', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const branchPierce = (ulid: string): PierceRequest => ({
    target,
    ulid,
    isolate: 'test-isolate',
    functionName: 'test',
    params: {},
    proctype: PROCTYPE.BRANCH,
  })
  const reply: Reply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
  }
  await git.init(fs, 'git/test')

  let branchFs: IFs
  let childPid: PID
  const request = branchPierce('pierce')
  await t.step('branch', async () => {
    const { commit, branches } = await git.solidify(fs, [request])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(request)
    expect(io.requests[0].proctype).toEqual(PROCTYPE.BRANCH)
    branchFs = FS.clone(fs, '/.git')
    const { requests } = await git.branch(branchFs, commit, branches[0])
    expect(requests).toHaveLength(1)
    expect(requests[0].source).toEqual(request.target)
    const branch: IoStruct = readIo(branchFs)
    log('branch', branch)

    childPid = branches[0]
    expect(childPid.branches).toEqual(['main', '0'])
  })
  let mergeReply: MergeReply
  await t.step('branch reply', async () => {
    const branchReply = merge({}, reply, { target: childPid })
    const solidified = await git.solidify(branchFs, [branchReply])
    const { replies } = solidified

    log('replies', replies[0])
    expect(replies.length).toBe(1)
    assert(isMergeReply(replies[0]))
    mergeReply = replies[0]
    expect(mergeReply.outcome).toEqual(reply.outcome)
    expect(mergeReply.target).toEqual(target)
  })
  await t.step('merge', async () => {
    FS.copyObjects(branchFs, fs)
    const { replies } = await git.solidify(fs, [mergeReply])
    expect(replies).toHaveLength(1)
    const reply = replies[0]
    assert(isPierceReply(reply), 'not PierceReply')
    expect(reply.ulid).toEqual(request.ulid)
    expect(reply.outcome).toEqual(mergeReply.outcome)
    const [lastCommit] = await gitCommand.log({ fs, dir: '/', depth: 1 })
    expect(lastCommit.commit.parent).toHaveLength(2)
  })
})

const readIo = (fs: IFs) => {
  return JSON.parse(fs.readFileSync('/.io.json').toString())
}
