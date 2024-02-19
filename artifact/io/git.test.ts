import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import merge from 'npm:lodash.merge'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '@utils'
import * as git from './git.ts'
import { IoStruct, PID, PROCTYPE, Request } from '@/artifact/constants.ts'
import { Reply } from '@/artifact/constants.ts'
import gitCommand from '$git'

Deno.test('serial', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const request: Request = {
    target,
    source: { nonce: 'test-nonce' },
    isolate: 'test-isolate',
    functionName: 'test',
    params: {},
    proctype: PROCTYPE.SERIAL,
  }
  const reply: Reply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
  }
  await t.step('init', async () => {
    const pid = await git.init(fs, 'git/test')
    expect(pid).toEqual(target)
    expect(fs.existsSync('/.git')).toBe(true)
  })
  await t.step('pierce', async () => {
    const { requests } = await git.solidifyPool(fs, [request])
    expect(requests).toHaveLength(1)
    expect(requests[0]).toEqual(request)
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.inputs[0]).toEqual(request)
  })
  await t.step('pierce reply', async () => {
    const { replies, requests } = await git.solidifyPool(fs, [reply])
    expect(requests).toHaveLength(0)
    expect(replies).toHaveLength(1)
    expect(replies[0].target).toEqual(request.source)
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.outputs[0]).toEqual(reply.outcome)
  })
  await t.step('second action blanks io', async () => {
    await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.inputs[0]).toBeUndefined()
    expect(io.inputs[1]).toEqual(request)
    expect(io.outputs[0]).toBeUndefined()
  })
  await t.step('multiple requests', async () => {
    await git.solidifyPool(fs, [request, request])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.inputs).length).toBe(3)
    expect(io.outputs).toEqual({})
  })
  await t.step('multiple replies', async () => {
    const pool = replies(1, 3)
    await git.solidifyPool(fs, pool)
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.inputs).length).toBe(3)
    expect(Object.keys(io.outputs).length).toEqual(3)
  })
  // cannot reply out of order
  // permissioning for inclusion in the pool
  // duplicate items in the pool are reduced to a single item
  // duplicate replies error
})
const replies = (start: number, end: number) => {
  const pool: Reply[] = []
  for (let i = start; i <= end; i++) {
    pool.push({
      target: { account: 'git', repository: 'test', branches: ['main'] },
      sequence: i,
      outcome: { result: i },
    })
  }
  return pool
}

Deno.test('branch', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const request: Request = {
    target,
    source: { nonce: 'test-nonce' },
    isolate: 'test-isolate',
    functionName: 'test',
    params: {},
    proctype: PROCTYPE.BRANCH,
  }
  const reply: Reply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
  }
  await git.init(fs, 'git/test')

  let branchFs: IFs
  let childPid: PID
  await t.step('branch', async () => {
    const { commit, branches } = await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(1)
    expect(io.inputs[0]).toEqual(request)
    expect(io.inputs[0].proctype).toEqual(PROCTYPE.BRANCH)

    branchFs = copy(fs)
    const { requests } = await git.branch(branchFs, commit, branches[0])
    expect(requests).toHaveLength(1)
    expect(requests[0].source).toEqual(request.target)
    const branch: IoStruct = readIo(branchFs)
    log('branch', branch)

    childPid = branches[0]
    expect(childPid.branches).toEqual(['main', '0'])
  })
  let originReply: Reply
  await t.step('branch reply', async () => {
    const branchReply = merge({}, reply, { target: childPid })
    const solidified = await git.solidifyPool(branchFs, [branchReply])
    const { commit, replies } = solidified

    log('replies', replies[0])
    expect(replies.length).toBe(1)
    originReply = replies[0]
    expect(originReply.outcome).toEqual(reply.outcome)
    expect(originReply.target).toEqual(target)
    originReply.fs = branchFs
    originReply.commit = commit
  })
  await t.step('merge', async () => {
    const { replies } = await git.solidifyPool(fs, [originReply])
    expect(replies).toHaveLength(1)
    const reply = replies[0]
    expect(reply.fs).toBeUndefined()
    expect(reply.commit).toBeUndefined()
    expect(reply.target).toEqual(request.source)
    expect(reply.outcome).toEqual(originReply.outcome)
    const [lastCommit] = await gitCommand.log({ fs, dir: '/', depth: 1 })
    expect(lastCommit.commit.parent).toHaveLength(2)
  })

  // permissioning for inclusion in the pool
  // duplicate items in the pool are reduced to a single item
  // duplicate replies error
})

// need to test requests coming out of pooling, and isolate execution

// should start connecting to other parts of the system
// try run a runner call in this system

const copy = (fs: IFs) => {
  const snapshotData = snapshot.toBinarySnapshotSync({ fs, path: '/.git' })
  const { fs: copy } = memfs()
  snapshot.fromBinarySnapshotSync(snapshotData, { fs: copy, path: '/.git' })
  return copy
}
const readIo = (fs: IFs) => {
  return JSON.parse(fs.readFileSync('/.io.json').toString())
}

// IPC types
// process with feedback
// process with additional actions received within it
// long running process that doesn't end
// daemon start
// daemon handover - like nohup
