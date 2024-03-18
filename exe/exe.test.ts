import { memfs } from '$memfs'
import IOChannel from '../io/io-channel.ts'
import FS from '../fs.ts'
import Executor from './exe.ts'
import { IFs, PROCTYPE, SolidRequest } from '@/constants.ts'
import { assert, expect, log } from '@utils'
import { init } from '../git/mod.ts'

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
const mocks = async () => {
  const { fs } = memfs()
  const { commit } = await init(fs, 'exe/test')
  const io = await IOChannel.load(pid, fs, commit)
  return { io, fs, commit }
}
Deno.test('simple', async (t) => {
  const { fs, io, commit } = await mocks()
  io.addRequest(request)
  io.save()
  const executor = Executor.create()
  await t.step('no accumulations', async () => {
    const result = await executor.execute(pid, commit, request, fs)
    const { settled, pending } = result
    assert(settled)
    expect(pending).toBeFalsy()
    const { reply, upserts, deletes } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome).toEqual({ result: 'local reply' })
    expect(upserts).toHaveLength(0)
    expect(deletes).toHaveLength(0)
  })
})
Deno.test('writes', async (t) => {
  const { fs, io, commit } = await mocks()
  const write = {
    ...request,
    functionName: 'write',
    params: { path: 'test.txt', content: 'hello' },
  }
  io.addRequest(write)
  io.save()
  const executor = Executor.create()
  await t.step('single file', async () => {
    const result = await executor.execute(pid, commit, write, fs)
    const { settled, pending } = result
    assert(settled)
    expect(pending).toBeFalsy()
    const { reply, upserts, deletes } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome.result).toBeUndefined()
    expect(upserts).toEqual(['test.txt'])
    expect(deletes).toHaveLength(0)
  })
  // write, delete, write
  // write, delete,
  // delete existing file
  // multiple writes to the same file

  // check the broadcasting is working
  // throttle the broadcast updates - thrash to check it works
})

Deno.test('loopback', async (t) => {
  const { fs, io, commit } = await mocks()
  const compound = { ...request, functionName: 'compound' }
  io.addRequest(compound)
  io.save()
  const executor = Executor.create()
  await t.step('loopback request will error', async () => {
    const result = await executor.execute(pid, commit, compound, fs)
    const { settled, pending } = result
    expect(pending).toBeFalsy()
    assert(settled)
    const { reply } = settled
    expect(reply.target).toEqual(pid)
    expect(reply.outcome.error).toBeDefined()
  })
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
  const { io, fs, commit } = await mocks()
  io.addRequest(compound)
  io.save()
  let request: SolidRequest
  const executor = Executor.create()
  let halfFs: IFs
  await t.step('half done', async () => {
    const half = await executor.execute(pid, commit, compound, fs)
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
    halfFs = FS.clone(fs)
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

    const done = await executor.execute(pid, commit, compound, fs)
    const { settled, pending } = done
    expect(pending).toBeFalsy()
    expect(settled).toBeTruthy()
  })
  await t.step('reply from restart', async () => {
    const noCache = Executor.create()
    assert(request)
    const commit = halfFs.readFileSync('/.git/refs/heads/main').toString()
      .trim()
    const io = await IOChannel.load(pid, halfFs, commit)
    const sequence = io.addRequest(request)
    expect(sequence).toBe(1)
    const reply = {
      outcome: { result: 'compound reply' },
      target: request.source,
      sequence,
    }
    io.reply(reply)
    io.save()

    const done = await noCache.execute(pid, commit, compound, halfFs)
    const { settled, pending } = done
    expect(pending).toBeFalsy()
    expect(settled).toBeTruthy()
  })

  // multiple outstanding requests
  // test that it will not get rerun unless all outstanding are returned
  // test rejection
  // dangling requests are awaited until function resolves
  // branch request to self is ok
  // test multiple cycles thru requests and replies
  // test making different request between two invocations
})
