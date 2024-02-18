import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import merge from 'npm:lodash.merge'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '@utils'
import * as git from './git.ts'
import { IoStruct, PID, PROCTYPE, Request } from '@/artifact/constants.ts'
import { Reply } from '@/artifact/constants.ts'

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
    const _pid = await git.init(fs, 'git/test')
    expect(_pid).toEqual(target)
    expect(fs.existsSync('/.git')).toBe(true)
  })
  await t.step('pierce', async () => {
    await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.inputs[0]).toEqual(request)
  })
  await t.step('pierce reply', async () => {
    await git.solidifyPool(fs, [reply])
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
Deno.test.only('branch', async (t) => {
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

  await t.step('branch', async () => {
    const { commit, branches } = await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(1)
    expect(io.inputs[0]).toEqual(request)
    expect(io.inputs[0].proctype).toEqual(PROCTYPE.BRANCH)

    const branchFs = copy(fs)
    await git.branch(branchFs, commit, branches[0])
    const branch: IoStruct = readIo(branchFs)
    log('branch', branch)

    const childPid = branches[0]
    expect(childPid.branches).toEqual(['main', '0'])
    const branchReply = merge({}, reply, { target: childPid })
    const { replies } = await git.solidifyPool(branchFs, [branchReply])
    Debug.enable('AI:git *tests')
    log('replies', replies[0])
    expect(replies.length).toBe(1)
    expect(replies[0].outcome).toEqual(reply.outcome)
    expect(replies[0].target).toEqual(target)

    // copy over the reply to the parent branch
    // this is the heavy piece - copying raw objects over to the parent branch

    await git.solidifyPool
  })
  await t.step('concurrent branching', async () => {
  })
  // await t.step('pierce reply', async () => {
  //   await git.solidifyPool(fs, [reply])
  //   const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
  //   log('io', io)
  //   expect(io.sequence).toBe(1)
  //   expect(io.outputs[0]).toEqual(reply.outcome)
  // })
  // await t.step('second action blanks io', async () => {
  //   await git.solidifyPool(fs, [request])
  //   const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
  //   log('io', io)
  //   expect(io.sequence).toBe(2)
  //   expect(io.inputs[0]).toBeUndefined()
  //   expect(io.inputs[1]).toEqual(request)
  //   expect(io.outputs[0]).toBeUndefined()
  // })
  // await t.step('multiple requests', async () => {
  //   await git.solidifyPool(fs, [request, request])
  //   const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
  //   expect(io.sequence).toBe(4)
  //   expect(Object.keys(io.inputs).length).toBe(3)
  //   expect(io.outputs).toEqual({})
  // })
  // await t.step('multiple replies', async () => {
  //   Debug.enable('AI:git *tests')
  //   const pool = replies(1, 3)
  //   await git.solidifyPool(fs, pool)
  //   const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
  //   expect(io.sequence).toBe(4)
  //   expect(Object.keys(io.inputs).length).toBe(3)
  //   expect(Object.keys(io.outputs).length).toEqual(3)
  // })

  // permissioning for inclusion in the pool
  // duplicate items in the pool are reduced to a single item
  // duplicate replies error
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

// IPC types
// process with feedback
// process with additional actions received within it
// long running process that doesn't end
// daemon start
// daemon handover - like nohup
