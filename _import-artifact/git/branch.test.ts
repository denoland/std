import { assert, expect, log, merge } from '@utils'
import { solidify } from '@/git/solidify.ts'
import { branch } from '@/git/branch.ts'
import {
  IoStruct,
  isMergeReply,
  MergeReply,
  PartialPID,
  PID,
  Pierce,
  Proctype,
  UnsequencedRequest,
} from '@/constants.ts'
import FS from '@/git/fs.ts'
import DB from '@/db.ts'

Deno.test('pierce branch', async (t) => {
  const partial: PartialPID = {
    account: 'git',
    repository: 'test',
    branches: ['main'],
  }
  const db = await DB.create(DB.generateAesKey())
  const baseFs = await FS.init(partial, db)
  const target = baseFs.pid
  const mockRequest: UnsequencedRequest = {
    target,
    isolate: 'mock',
    functionName: 'mock',
    params: {},
    proctype: Proctype.enum.SERIAL,
  }
  const branchPierce = (ulid: string): Pierce => ({
    target,
    ulid,
    isolate: 'test-isolate',
    functionName: 'test',
    params: { request: mockRequest },
    proctype: Proctype.enum.BRANCH,
  })
  const reply: MergeReply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
    commit: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
    source: target,
  }
  const pierce = branchPierce('pierce')
  let head: string
  let parentHead: string
  let branches: number[]
  let branchPid: PID

  await t.step('parent', async () => {
    const solids = await solidify(baseFs, [pierce])
    head = solids.oid
    parentHead = head
    branches = solids.branches
    expect(branches).toEqual([0])
    expect(solids.exe).toBeUndefined()
    const next = FS.open(baseFs.pid, head, db)
    expect(next.oid).toEqual(solids.oid)
    const io = await next.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
    expect(io.requests[0].proctype).toEqual(Proctype.enum.BRANCH)
  })
  await t.step('child', async () => {
    const parentFs = FS.open(baseFs.pid, head, db)
    expect(parentFs.oid).toEqual(head)
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
    expect(branchFs.oid).toEqual(head)
    const solids = await solidify(branchFs, [branchReply])
    const { poolables } = solids
    log('poolables', poolables[0])
    expect(poolables.length).toBe(1)
    assert(isMergeReply(poolables[0]))
    mergeReply = poolables[0]
    expect(mergeReply.outcome).toEqual(reply.outcome)
    expect(mergeReply.target).toEqual(target)

    const { commit, sequence, source } = mergeReply
    const isReply = true
    const recovered = await db.readPoolable(mergeReply.target, {
      commit,
      sequence,
      source,
      isReply,
    })
    expect(recovered).toEqual(mergeReply)
  })
  await t.step('child merge to parent', async () => {
    const parentFs = FS.open(baseFs.pid, parentHead, db)
    expect(parentFs.oid).not.toEqual(head)

    const { poolables, oid } = await solidify(parentFs, [mergeReply])
    expect(poolables).toHaveLength(0)
    const next = FS.open(parentFs.pid, oid, db)
    const io = await next.readJSON<IoStruct>('.io.json')
    const outcome = io.replies[0]
    expect(outcome).toEqual(mergeReply.outcome)
    const lastCommit = await next.getCommit()
    expect(lastCommit.parent).toHaveLength(2)
  })
  db.stop()
})
// TODO delete branches
// TODO custom names honoured
// TODO error if name collision
