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
import FS from '@/git/fs.ts'
import DB from '@/db.ts'

Deno.test('pierce branch', async (t) => {
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
  const db = await DB.create()
  const baseFs = await FS.init('git/test', db)
  const pierce = branchPierce('pierce')
  let latestCommit: string
  let branches: number[]
  let branchPid: PID

  await t.step('parent', async () => {
    const solids = await git.solidify(baseFs, [pierce])
    latestCommit = solids.commit
    branches = solids.branches
    expect(branches).toEqual([0])
    expect(solids.request).toBeUndefined()
    const next = await FS.openHead(baseFs.pid, db)
    expect(next.commit).toEqual(solids.commit)
    const io = await next.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
    expect(io.requests[0].proctype).toEqual(PROCTYPE.BRANCH)
  })
  await t.step('child', async () => {
    const parentFs = await FS.openHead(baseFs.pid, db)
    expect(parentFs.commit).toEqual(latestCommit)
    expect(branches).toEqual([0])
    const sequence = branches[0]
    const branched = await git.branch(parentFs, sequence)
    expect(branched.origin.source).toEqual(pierce.target)
    latestCommit = branched.commit
    branchPid = branched.origin.target
  })
  let mergeReply: MergeReply
  await t.step('child reply', async () => {
    const branchReply = merge({}, reply, { target: branchPid })
    const branchFs = await FS.openHead(branchPid, db)
    expect(branchFs.commit).toEqual(latestCommit)
    const solids = await git.solidify(branchFs, [branchReply])
    const { replies } = solids

    log('replies', replies[0])
    expect(replies.length).toBe(1)
    assert(isMergeReply(replies[0]))
    mergeReply = replies[0]
    expect(mergeReply.outcome).toEqual(reply.outcome)
    expect(mergeReply.target).toEqual(target)
  })
  await t.step('child merge to parent', async () => {
    const parentFs = await FS.openHead(baseFs.pid, db)
    expect(parentFs.commit).not.toEqual(latestCommit)
    const { replies } = await git.solidify(parentFs, [mergeReply])
    expect(replies).toHaveLength(1)
    const reply = replies[0]
    assert(isPierceReply(reply), 'not PierceReply')
    expect(reply.ulid).toEqual(pierce.ulid)
    expect(reply.outcome).toEqual(mergeReply.outcome)
    const [lastCommit] = await parentFs.logs()
    expect(lastCommit.commit.parent).toHaveLength(2)
  })
  db.stop()
})

// TODO custom names honoured
// TODO error if name collision
