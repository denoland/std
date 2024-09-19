import { assert, expect, log } from '@utils'
import { solidify } from '@/git/solidify.ts'
import {
  IoStruct,
  MergeReply,
  PartialPID,
  PID,
  Pierce,
  Proctype,
  UnsequencedRequest,
} from '@/constants.ts'
import FS from './fs.ts'
import DB from '@/db.ts'

Deno.test('pierce serial', async (t) => {
  const db = await DB.create(DB.generateAesKey())
  const partial: PartialPID = {
    account: 'git',
    repository: 'test',
    branches: ['main'],
  }
  let fs = await FS.init(partial, db)
  const target: PID = fs.pid
  const mockRequest: UnsequencedRequest = {
    target,
    isolate: 'mock',
    functionName: 'mock',
    params: {},
    proctype: Proctype.enum.SERIAL,
  }
  // TODO move away from using pierces to test these functions
  const pierceFactory = (ulid: string): Pierce => ({
    target,
    ulid,
    isolate: 'test-isolate',
    functionName: 'test',
    params: { request: mockRequest },
    proctype: Proctype.enum.SERIAL,
  })
  const reply: MergeReply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
    source: target,
    commit: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  }
  await t.step('init', async () => {
    const logs = await fs.logs()
    expect(logs).toHaveLength(1)
    expect(fs.pid).toEqual(target)
  })
  const pierce = pierceFactory('pierce')
  await t.step('pierce', async () => {
    const { exe, oid } = await solidify(fs, [pierce])
    assert(exe)
    expect(exe.request).not.toHaveProperty('ulid')

    fs = FS.open(fs.pid, oid, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
  })
  await t.step('pierce reply', async () => {
    const { oid, poolables, exe } = await solidify(fs, [reply])
    expect(oid).not.toBe(fs.oid)
    expect(exe).toBeUndefined()
    expect(poolables).toHaveLength(0)

    fs = FS.open(fs.pid, oid, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.replies[0]).toEqual(reply.outcome)
  })
  await t.step('second action blanks io', async () => {
    const { oid, exe } = await solidify(fs, [pierce])
    expect(oid).not.toBe(fs.oid)
    expect(exe).toBeDefined()

    fs = FS.open(fs.pid, oid, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.requests[0]).toBeUndefined()
    expect(io.requests[1]).toEqual(pierce)
    expect(io.replies[0]).toBeUndefined()
  })
  await t.step('multiple requests', async () => {
    const { oid, exe } = await solidify(fs, [
      pierceFactory('a'),
      pierceFactory('b'),
    ])
    expect(oid).not.toBe(fs.oid)
    expect(exe).toBeUndefined()

    fs = FS.open(fs.pid, oid, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(io.replies).toEqual({})
  })
  await t.step('multiple replies', async () => {
    const pool = replies(1, 3)
    const { oid } = await solidify(fs, pool)
    expect(oid).not.toBe(fs.oid)

    fs = FS.open(fs.pid, oid, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(Object.keys(io.replies).length).toEqual(3)
  })
  db.stop()
  // TODO cannot reply out of order
  // TODO permissioning for inclusion in the pool
})
const replies = (start: number, end: number) => {
  const pool: MergeReply[] = []
  for (let i = start; i <= end; i++) {
    const target = {
      repoId: 't',
      account: 'git',
      repository: 'test',
      branches: ['main'],
    }
    pool.push({
      target,
      source: target,
      commit: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
      sequence: i,
      outcome: { result: i },
    })
  }
  return pool
}
