import IOChannel from '../io/io-channel.ts'
import FS from '../git/fs.ts'
import Executor from './exe.ts'
import { PROCTYPE, SolidRequest } from '@/constants.ts'
import { assert, expect, log } from '@utils'
import DB from '@/db.ts'

const pid = { account: 'exe', repository: 'test', branches: ['main'] }
const source = { ...pid, account: 'higher' }
const request: SolidRequest = {
  isolate: 'io-fixture',
  functionName: 'local',
  params: {},
  proctype: PROCTYPE.SERIAL,
  target: pid,
  source,
  sequence: 0,
}
const mocks = async (initialRequest: SolidRequest) => {
  const db = await DB.create()
  let fs = await FS.init('exe/test', db)
  let io = await IOChannel.load(fs)
  io.addRequest(initialRequest)
  io.save()
  fs = await fs.writeCommitObject()
  io = await IOChannel.load(fs)
  const stop = () => db.stop()
  return { io, fs, db, stop }
}
Deno.test('simple', async (t) => {
  const { fs, stop } = await mocks(request)
  const executor = Executor.createCache()
  await t.step('no accumulations', async () => {
    const result = await executor.execute(request, fs)
    const { settled, pending } = result
    assert(settled)
    expect(pending).toBeFalsy()
    const { reply, fs: settledFs } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome).toEqual({ result: 'local reply' })
    expect(settledFs).toEqual(fs)
    expect(settledFs.isChanged).toBeFalsy()
  })
  stop()
})
Deno.test('writes', async (t) => {
  const write = {
    ...request,
    functionName: 'write',
    params: { path: 'test.txt', content: 'hello' },
  }
  const { fs, stop } = await mocks(write)
  const executor = Executor.createCache()
  await t.step('single file', async () => {
    const result = await executor.execute(write, fs)
    const { settled, pending } = result
    assert(settled)
    expect(pending).toBeFalsy()
    const { reply, fs: settledFs } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome.result).toBeUndefined()
    expect(settledFs).toEqual(fs)
    expect(settledFs.upserts).toEqual(['test.txt'])
    expect(settledFs.deletes).toHaveLength(0)
  })
  stop()
  // write, delete, write
  // write, delete,
  // delete existing file
  // multiple writes to the same file

  // check the broadcasting is working
  // throttle the broadcast updates - thrash to check it works
})

Deno.test('loopback', async (t) => {
  const compound = { ...request, functionName: 'compound' }
  const { fs, stop } = await mocks(compound)
  const executor = Executor.createCache()
  await t.step('loopback request will error', async () => {
    // execute should start with an unchanged fs tho
    const result = await executor.execute(compound, fs)
    const { settled, pending } = result
    expect(pending).toBeFalsy()
    assert(settled)
    const { reply } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome.error).toBeDefined()
  })
  stop()
})

Deno.test('compound', async (t) => {
  const target = { account: 'exe', repository: 'other', branches: ['other'] }
  const compound = {
    isolate: 'io-fixture',
    proctype: PROCTYPE.SERIAL,
    target: pid,
    source,
    sequence: 0,
    functionName: 'compound',
    params: { target },
  }
  const { io, fs, db, stop } = await mocks(compound)
  let request: SolidRequest
  const executor = Executor.createCache()
  let halfFs: FS
  await t.step('half done', async () => {
    const half = await executor.execute(compound, fs)
    const { settled, pending } = half
    expect(settled).toBeFalsy()
    assert(pending)
    const { requests } = pending
    expect(requests).toHaveLength(1)
    request = requests[0]
    log('internalRequest', request)
    expect(request.target).toEqual(target)
    expect(request.source).toEqual(pid)
    expect(request.sequence).toEqual(0)
    halfFs = FS.open(fs.pid, fs.commit, db)
  })
  await t.step('reply using function cache', async () => {
    assert(request)
    const sequence = io.addRequest(request)
    expect(sequence).toBe(1)
    const reply = {
      outcome: { result: 'compound reply' },
      target: request.source,
      sequence,
    }
    const savedRequest = io.reply(reply)
    expect(savedRequest).toEqual(request)
    io.save()
    const replyFs = await fs.writeCommitObject()

    const done = await executor.execute(compound, replyFs)
    const { settled, pending } = done
    expect(pending).toBeFalsy()
    assert(settled, 'settled')
  })
  await t.step('reply from replay', async () => {
    const head = await db.readHead(halfFs.pid)
    assert(head, 'could not rollback')
    await db.updateHead(halfFs.pid, head, halfFs.commit)
    const noCache = Executor.createCache()
    assert(request)
    const io = await IOChannel.load(halfFs)
    const sequence = io.addRequest(request)
    expect(sequence).toBe(1)
    const reply = {
      outcome: { result: 'compound reply' },
      target: request.source,
      sequence,
    }
    io.reply(reply)
    io.save()
    const replyFs = await halfFs.writeCommitObject()

    const done = await noCache.execute(compound, replyFs)
    const { settled, pending } = done
    expect(pending).toBeFalsy()
    expect(settled).toBeTruthy()
  })
  stop()

  // multiple outstanding requests
  // test that it will not get rerun unless all outstanding are returned
  // test rejection
  // dangling requests are awaited until function resolves
  // branch request to self is ok
  // test multiple cycles thru requests and replies
  // test making different request between two invocations
})
