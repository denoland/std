import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { assert, expect, log, merge } from '@utils'
import * as git from './git.ts'
import { IoStruct, PID, PROCTYPE, Reply } from '@/artifact/constants.ts'
import gitCommand from '$git'
import { PierceRequest } from '@/artifact/constants.ts'
import { InternalReply } from '@/artifact/constants.ts'
import { MergeReply } from '@/artifact/constants.ts'
import { PierceReply } from '@/artifact/constants.ts'

Deno.test('pierce branch', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const pierce = (ulid: string): PierceRequest => ({
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
  const request = pierce('pierce')
  await t.step('branch', async () => {
    const { commit, branches } = await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(request)
    expect(io.requests[0].proctype).toEqual(PROCTYPE.BRANCH)

    branchFs = copy(fs)
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
    const solidified = await git.solidifyPool(branchFs, [branchReply])
    const { commit, replies } = solidified

    log('replies', replies[0])
    expect(replies.length).toBe(1)
    const originReply = replies[0] as InternalReply
    expect(originReply.outcome).toEqual(reply.outcome)
    expect(originReply.target).toEqual(target)
    mergeReply = { ...originReply, fs: branchFs, commit }
  })
  await t.step('merge', async () => {
    const { replies } = await git.solidifyPool(fs, [mergeReply])
    expect(replies).toHaveLength(1)
    const reply = replies[0]
    assert(isPierceReply(reply), 'not PierceReply')
    expect(reply.ulid).toEqual(request.ulid)
    expect(reply.outcome).toEqual(mergeReply.outcome)
    const [lastCommit] = await gitCommand.log({ fs, dir: '/', depth: 1 })
    expect(lastCommit.commit.parent).toHaveLength(2)
  })
})
Deno.test('isolate branch', async (t) => {
  // when a branch is triggered from within an isolate
  const { fs } = memfs()
  // const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  // const pierce = (ulid: string): PierceRequest => ({
  //   target,
  //   ulid,
  //   isolate: 'test-isolate',
  //   functionName: 'test',
  //   params: {},
  //   proctype: PROCTYPE.BRANCH,
  // })
  // const reply: Reply = {
  //   target,
  //   sequence: 0,
  //   outcome: { result: 'test-result' },
  // }
  // await git.init(fs, 'git/test')

  // let branchFs: IFs
  // let childPid: PID
  // const request = pierce('pierce')
  // await t.step('branch', async () => {
  //   const { commit, branches } = await git.solidifyPool(fs, [request])
  //   const io: IoStruct = readIo(fs)
  //   expect(io.sequence).toBe(1)
  //   expect(io.requests[0]).toEqual(request)
  //   expect(io.requests[0].proctype).toEqual(PROCTYPE.BRANCH)

  //   branchFs = copy(fs)
  //   const { requests } = await git.branch(branchFs, commit, branches[0])
  //   expect(requests).toHaveLength(1)
  //   expect(requests[0].source).toEqual(request.target)
  //   const branch: IoStruct = readIo(branchFs)
  //   log('branch', branch)

  //   childPid = branches[0]
  //   expect(childPid.branches).toEqual(['main', '0'])
  // })
  // let mergeReply: MergeReply
  // await t.step('branch reply', async () => {
  //   const branchReply = merge({}, reply, { target: childPid })
  //   const solidified = await git.solidifyPool(branchFs, [branchReply])
  //   const { commit, replies } = solidified

  //   log('replies', replies[0])
  //   expect(replies.length).toBe(1)
  //   const originReply = replies[0] as InternalReply
  //   expect(originReply.outcome).toEqual(reply.outcome)
  //   expect(originReply.target).toEqual(target)
  //   mergeReply = { ...originReply, fs: branchFs, commit }
  // })
  // await t.step('merge', async () => {
  //   const { replies } = await git.solidifyPool(fs, [mergeReply])
  //   expect(replies).toHaveLength(1)
  //   const reply = replies[0]
  //   assert(isPierceReply(reply), 'not PierceReply')
  //   expect(reply.ulid).toEqual(request.ulid)
  //   expect(reply.outcome).toEqual(mergeReply.outcome)
  //   const [lastCommit] = await gitCommand.log({ fs, dir: '/', depth: 1 })
  //   expect(lastCommit.commit.parent).toHaveLength(2)
  // })
})

const copy = (fs: IFs) => {
  const snapshotData = snapshot.toBinarySnapshotSync({ fs, path: '/.git' })
  const { fs: copy } = memfs()
  snapshot.fromBinarySnapshotSync(snapshotData, { fs: copy, path: '/.git' })
  return copy
}
const readIo = (fs: IFs) => {
  return JSON.parse(fs.readFileSync('/.io.json').toString())
}
const isPierceReply = (reply: Reply): reply is PierceReply => {
  return ('ulid' in reply)
}
