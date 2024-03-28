import { expect, log } from '@utils'
import * as git from './mod.ts'
import {
  IoStruct,
  PID,
  PierceReply,
  PierceRequest,
  PROCTYPE,
  Reply,
  SolidReply,
} from '@/constants.ts'
import FS from './fs.ts'
import DB from '@/db.ts'

Deno.test('pierce serial', async (t) => {
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
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
    fs = await FS.init('git/test', db)
    const logs = await fs.logs()
    expect(logs).toHaveLength(1)
    expect(fs.pid).toEqual(target)
  })
  const pierce = pierceFactory('pierce')
  await t.step('pierce', async () => {
    const { request, commit } = await git.solidify(fs, [pierce])
    expect(request).not.toHaveProperty('ulid')
    fs = FS.open(fs.pid, commit, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(pierce)
  })
  await t.step('pierce reply', async () => {
    const { commit, replies, request } = await git.solidify(fs, [reply])
    expect(request).toBeUndefined()
    expect(replies).toHaveLength(1)
    log('replies', replies[0])
    const pierceReply = replies[0] as PierceReply
    expect(pierceReply.ulid).toEqual(pierce.ulid)
    expect(pierceReply.outcome).toEqual(reply.outcome)
    fs = FS.open(fs.pid, commit, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.replies[0]).toEqual(pierceReply.outcome)
  })
  await t.step('second action blanks io', async () => {
    const { commit, request } = await git.solidify(fs, [pierce])
    expect(request).toBeDefined()
    fs = FS.open(fs.pid, commit, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.requests[0]).toBeUndefined()
    expect(io.requests[1]).toEqual(pierce)
    expect(io.replies[0]).toBeUndefined()
  })
  await t.step('multiple requests', async () => {
    const { commit, request } = await git.solidify(fs, [
      pierceFactory('a'),
      pierceFactory('b'),
    ])
    expect(request).toBeUndefined()
    fs = FS.open(fs.pid, commit, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(io.replies).toEqual({})
  })
  await t.step('multiple replies', async () => {
    const pool = replies(1, 3)
    const { commit } = await git.solidify(fs, pool)
    fs = FS.open(fs.pid, commit, db)
    const io = await fs.readJSON<IoStruct>('.io.json')
    expect(io.sequence).toBe(4)
    expect(Object.keys(io.requests).length).toBe(3)
    expect(Object.keys(io.replies).length).toEqual(3)
  })
  await t.step('duplicate pool items rejects', async () => {
    const msg = 'duplicate pool items: '
    await expect(git.solidify(fs, [pierce, pierce]))
      .rejects.toThrow(msg)
    const reply = replies(1, 1)[0]
    await expect(git.solidify(fs, [reply, reply]))
      .rejects.toThrow(msg)
    await expect(git.solidify(fs, [pierce, pierce, reply, reply]))
      .rejects.toThrow(msg)
  })
  db.stop()
  // TODO cannot reply out of order
  // TODO permissioning for inclusion in the pool
})
const replies = (start: number, end: number) => {
  const pool: SolidReply[] = []
  for (let i = start; i <= end; i++) {
    pool.push({
      target: { account: 'git', repository: 'test', branches: ['main'] },
      sequence: i,
      outcome: { result: i },
    })
  }
  return pool
}
