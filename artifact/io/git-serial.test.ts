import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '@utils'
import * as git from './git.ts'
import {
  IoStruct,
  PID,
  PierceRequest,
  PROCTYPE,
  Reply,
} from '@/artifact/constants.ts'
import { InternalReply } from '@/artifact/constants.ts'

Deno.test('serial', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const pierce: PierceRequest = {
    target,
    ulid: 'test-id',
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
    const { requests, priors } = await git.solidifyPool(fs, [pierce])
    expect(requests).toHaveLength(1)
    expect(requests[0]).toEqual(pierce)
    expect(priors).toEqual([undefined])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
  })
  await t.step('pierce reply', async () => {
    const { replies, requests } = await git.solidifyPool(fs, [reply])
    expect(requests).toHaveLength(0)
    expect(replies).toHaveLength(1)
    log('replies', replies[0])
    // expect(replies[0].target).toEqual(pierce.source)
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.replies[0]).toEqual(reply.outcome)
  })
  await t.step('second action blanks io', async () => {
    const { priors } = await git.solidifyPool(fs, [pierce])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.requests[0]).toBeUndefined()
    expect(io.requests[1]).toEqual(pierce)
    expect(io.replies[0]).toBeUndefined()
    expect(priors).toEqual([undefined])
  })
  await t.step('multiple requests', async () => {
    const { priors, requests } = await git.solidifyPool(fs, [pierce, pierce])
    expect(requests).toHaveLength(2)
    expect(priors).toEqual([1, 2])
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(io.replies).toEqual({})
  })
  await t.step('multiple replies', async () => {
    const pool = replies(1, 3)
    await git.solidifyPool(fs, pool)
    const io: IoStruct = readIo(fs)
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(Object.keys(io.replies).length).toEqual(3)
  })
  // cannot reply out of order
  // permissioning for inclusion in the pool
  // duplicate items in the pool are reduced to a single item
  // duplicate replies error
})
const replies = (start: number, end: number) => {
  const pool: InternalReply[] = []
  for (let i = start; i <= end; i++) {
    pool.push({
      target: { account: 'git', repository: 'test', branches: ['main'] },
      sequence: i,
      outcome: { result: i },
    })
  }
  return pool
}

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
