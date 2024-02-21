import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '@utils'
import * as git from './git.ts'
import {
  IoStruct,
  PID,
  PierceReply,
  PierceRequest,
  PROCTYPE,
  Reply,
} from '@/artifact/constants.ts'
import { InternalReply } from '@/artifact/constants.ts'

Deno.test('serial', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  const pierce = (ulid: string): PierceRequest => ({
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
  await t.step('init', async () => {
    const pid = await git.init(fs, 'git/test')
    expect(pid).toEqual(target)
    expect(fs.existsSync('/.git')).toBe(true)
  })
  const request = pierce('pierce')
  await t.step('pierce', async () => {
    const { requests, priors } = await git.solidifyPool(fs, [request])
    expect(requests).toHaveLength(1)
    expect(requests[0]).not.toHaveProperty('ulid')
    expect(priors).toEqual([undefined])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.requests[0]).toEqual(request)
  })
  await t.step('pierce reply', async () => {
    const { replies, requests } = await git.solidifyPool(fs, [reply])
    expect(requests).toHaveLength(0)
    expect(replies).toHaveLength(1)
    log('replies', replies[0])
    const pierceReply = replies[0] as PierceReply
    expect(pierceReply.ulid).toEqual(request.ulid)
    expect(pierceReply.outcome).toEqual(reply.outcome)

    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.replies[0]).toEqual(pierceReply.outcome)
  })
  await t.step('second action blanks io', async () => {
    const { priors } = await git.solidifyPool(fs, [request])
    const io: IoStruct = readIo(fs)
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.requests[0]).toBeUndefined()
    expect(io.requests[1]).toEqual(request)
    expect(io.replies[0]).toBeUndefined()
    expect(priors).toEqual([undefined])
  })
  await t.step('multiple requests', async () => {
    const { priors, requests } = await git.solidifyPool(fs, [
      pierce('a'),
      pierce('b'),
    ])
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
  await t.step('duplicate pool items rejects', async () => {
    const msg = 'duplicate pool items: '
    await expect(git.solidifyPool(fs, [request, request]))
      .rejects.toThrow(msg)
    const reply = replies(1, 1)[0]
    await expect(git.solidifyPool(fs, [reply, reply]))
      .rejects.toThrow(msg)
    await expect(git.solidifyPool(fs, [request, request, reply, reply]))
      .rejects.toThrow(msg)
  })
  // TODO cannot reply out of order
  // TODO permissioning for inclusion in the pool
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

const readIo = (fs: IFs) => {
  return JSON.parse(fs.readFileSync('/.io.json').toString())
}
