import { assert, expect, log, merge } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
import {
  IoStruct,
  isMergeReply,
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
  let head: string
  let parentHead: string
  let branches: number[]
  let branchPid: PID

  await t.step('parent', async () => {
    const solids = await solidify(baseFs, [pierce])
    head = solids.commit
    parentHead = head
    branches = solids.branches
    expect(branches).toEqual([0])
    expect(solids.request).toBeUndefined()
    const next = FS.open(baseFs.pid, head, db)
    expect(next.commit).toEqual(solids.commit)
    const io = await next.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
    expect(io.requests[0].proctype).toEqual(PROCTYPE.BRANCH)
  })
  await t.step('child', async () => {
    const parentFs = FS.open(baseFs.pid, head, db)
    expect(parentFs.commit).toEqual(head)
    expect(branches).toEqual([0])
    const sequence = branches[0]
    const branched = await branch(parentFs, sequence)
    expect(branched.origin.source).toEqual(pierce.target)
    head = branched.head
    branchPid = branched.origin.target
    expect(branchPid).toEqual(branched.pid)
  })
  let mergeReply: MergeReply
  await t.step('child reply', async () => {
    const branchReply = merge({}, reply, { target: branchPid })
    const branchFs = FS.open(branchPid, head, db)
    expect(branchFs.commit).toEqual(head)
    const solids = await solidify(branchFs, [branchReply])
    const { replies } = solids

    log('replies', replies[0])
    expect(replies.length).toBe(1)
    assert(isMergeReply(replies[0]))
    mergeReply = replies[0]
    expect(mergeReply.outcome).toEqual(reply.outcome)
    expect(mergeReply.target).toEqual(target)
  })
  await t.step('child merge to parent', async () => {
    const parentFs = FS.open(baseFs.pid, parentHead, db)
    expect(parentFs.commit).not.toEqual(head)

    const { replies, commit } = await solidify(parentFs, [mergeReply])
    expect(replies).toHaveLength(0)
    const next = FS.open(parentFs.pid, commit, db)
    const io = await next.readJSON<IoStruct>('.io.json')
    const outcome = io.replies[0]
    expect(outcome).toEqual(mergeReply.outcome)
    const [lastCommit] = await next.logs()
    expect(lastCommit.commit.parent).toHaveLength(2)
  })
  db.stop()
})
// TODO delete branches
// TODO custom names honoured
// TODO error if name collision
