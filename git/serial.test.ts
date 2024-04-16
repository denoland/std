import { assert, expect, log } from '@utils'
import { solidify } from '@/git/solidify.ts'
import {
  IoStruct,
  PID,
  pidFromRepo,
  PierceRequest,
  PROCTYPE,
  Reply,
  SolidReply,
} from '@/constants.ts'
import FS from './fs.ts'
import DB from '@/db.ts'

Deno.test('pierce serial', async (t) => {
  const target: PID = {
    id: 't',
    account: 'git',
    repository: 'test',
    branches: ['main'],
  }
  const pierceFactory = (ulid: string): PierceRequest => ({
    target,
    ulid,
    isolate: 'test-isolate',
    functionName: 'test',
    params: {},
    proctype: PROCTYPE.SERIAL,
  })
  const reply: Reply = {
    target,
    sequence: 0,
    outcome: { result: 'test-result' },
  }
  const db = await DB.create()
  let fs: FS
  await t.step('init', async () => {
    const pid = pidFromRepo('t', 'git/test')
    fs = await FS.init(pid, db)
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
  const pool: SolidReply[] = []
  for (let i = start; i <= end; i++) {
    pool.push({
      target: {
        id: 't',
        account: 'git',
        repository: 'test',
        branches: ['main'],
      },
      sequence: i,
      outcome: { result: i },
    })
  }
  return pool
}
