import { memfs } from 'https://esm.sh/memfs@4.6.0'
import IOFile from '../io/io-file.ts'
import { execute } from './exe.ts'
import { Poolable, PROCTYPE, SolidRequest } from '@/artifact/constants.ts'
import { Debug, expect, log } from '@utils'

const pid = { account: 'exe', repository: 'test', branches: ['main'] }
const mocks = async () => {
  const inducted: Poolable[] = []
  const induct = (poolable: Poolable) => {
    inducted.push(poolable)
    return Promise.resolve()
  }
  const { fs } = memfs()
  const io = await IOFile.load(pid, fs)
  return { inducted, induct, io, fs }
}

Deno.test('exe', async (t) => {
  const commit = 'test-commit'
  const source = pid
  const request: SolidRequest = {
    isolate: 'io-fixture',
    functionName: 'local',
    params: {},
    proctype: PROCTYPE.SERIAL,
    target: pid,
    source,
    sequence: 0,
  }
  // export const execute: Execute = async (commit, request, fs, io) => {

  //   await t.step('no actions', async () => {
  //     const done = await execute(commit, request, fs, induct)
  //     expect(done).toBe(true)
  //     expect(inducted).toHaveLength(1)
  //     const reply = inducted[0] as SolidReply
  //     expect(reply.target).toEqual(target)
  //     expect(reply.outcome).toEqual({ result: 'local reply' })
  //   })
  await t.step('with actions', async () => {
    const target = { account: 'exe', repository: 'other', branches: ['other'] }
    const compound = {
      isolate: 'io-fixture',
      proctype: PROCTYPE.SERIAL,
      target: pid,
      source: { ...target, account: 'higher' },
      sequence: 0,
      functionName: 'compound',
      params: { target },
    }
    const { inducted, induct, io, fs } = await mocks()
    io.addRequest(compound)
    io.save()

    // TODO move these to steps
    const halfDone = await execute(pid, commit, compound, fs, induct)
    expect(halfDone).toBeFalsy()
    expect(inducted).toHaveLength(1)
    const internalRequest = inducted[0] as SolidRequest
    log('internalRequest', internalRequest)
    expect(internalRequest.target).toEqual(target)
    expect(internalRequest.source).toEqual(pid)
    expect(internalRequest.sequence).toEqual(0)

    io.addRequest(internalRequest)
    const sequence = io.getSequence(internalRequest)
    expect(sequence).toBe(1)
    io.addOutcome(sequence, { result: 'compound reply' })
    io.save()

    Debug.enable('AI:*')
    inducted.length = 0
    const done = await execute(pid, commit, compound, fs, induct)
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
