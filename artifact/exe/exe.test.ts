import { memfs } from 'https://esm.sh/memfs@4.6.0'
import IOFile from '../io/io-file.ts'
import Executor from './exe.ts'
import {
  IFs,
  PROCTYPE,
  SolidReply,
  SolidRequest,
} from '@/artifact/constants.ts'
import { assert, expect, log } from '@utils'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'

const pid = { account: 'exe', repository: 'test', branches: ['main'] }
const commit = 'test-commit'
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
  const inducted: (SolidRequest | SolidReply)[] = []
  const induct = (poolable: SolidRequest | SolidReply) => {
    inducted.push(poolable)
    return Promise.resolve()
  }
  const { fs } = memfs()
  const io = await IOFile.load(pid, fs)
  return { inducted, induct, io, fs }
}
Deno.test('simple', async (t) => {
  const { inducted, induct, fs, io } = await mocks()
  io.addRequest(request)
  io.save()
  const executor = Executor.create()
  await t.step('no actions', async () => {
    const done = await executor.execute(pid, commit, request, fs, induct)
    expect(done).toBe(true)
    expect(inducted).toHaveLength(1)
    const reply = inducted[0] as SolidReply
    expect(reply.target).toEqual(pid)
    expect(reply.outcome).toEqual({ result: 'local reply' })
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
  const { inducted, induct, io, fs } = await mocks()
  io.addRequest(compound)
  io.save()
  let request: SolidRequest
  const executor = Executor.create()
  let halfFs: IFs
  await t.step('half done', async () => {
    const halfDone = await executor.execute(pid, commit, compound, fs, induct)
    expect(halfDone).toBeFalsy()
    expect(inducted).toHaveLength(1)
    assert('source' in inducted[0], 'did not induct a request')
    request = inducted[0]
    log('internalRequest', request)
    expect(request.target).toEqual(target)
    expect(request.source).toEqual(pid)
    expect(request.sequence).toEqual(0)
    halfFs = clone(fs)
  })
  await t.step('reply using function cache', async () => {
    assert(request)
    io.addRequest(request)
    const sequence = io.getSequence(request)
    expect(sequence).toBe(1)
    io.addOutcome(sequence, { result: 'compound reply' })
    io.save()

    inducted.length = 0
    const done = await executor.execute(pid, commit, compound, fs, induct)
    expect(done).toBeTruthy()
    expect(inducted).toHaveLength(1)
  })
  await t.step('reply from restart', async () => {
    const noCache = Executor.create()
    assert(request)
    const io = await IOFile.load(pid, halfFs)
    io.addRequest(request)
    const sequence = io.getSequence(request)
    expect(sequence).toBe(1)
    io.addOutcome(sequence, { result: 'compound reply' })
    io.save()

    inducted.length = 0
    const done = await noCache.execute(pid, commit, compound, halfFs, induct)
    expect(done).toBeTruthy()
    expect(inducted).toHaveLength(1)
  })
  //   await t.step('loopback request will error', async () => {
  //     const compound = { ...request, functionName: 'compound' }
  //     const done = await execute(commit, compound, fs, induct)
  //     expect(done).toBe(true)
  //     expect(inducted).toHaveLength(1)
  //     const reply = inducted[0] as SolidReply
  //     expect(reply.target).toEqual(target)
  //     expect(reply.outcome.error).toBeDefined()
  //   })
  // multiple outstanding requests
  // test that it will not get rerun unless all outstanding are returned
  // requesting to self should error
  // test rejection
  // dangling requests are awaited until function resolves
  // BUT a branch request to self is ok
  // test multiple cycles thru requests and replies
  // test running the same multistep function but dump the execution cache
  // test making different request between two invocations
})
const clone = (fs: IFs) => {
  const uint8 = snapshot.toBinarySnapshotSync({ fs, path: '/' })
  const { fs: clone } = memfs()
  snapshot.fromBinarySnapshotSync(uint8, { fs: clone, path: '/' })
  return clone
}
