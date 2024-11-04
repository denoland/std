import IOChannel from '../engine/exe./../execution/io-channel.ts'
import FS from '../git/fs.ts'
import Executor from '../engine/exe./../execution/exe.ts'
import {
  C,
  isPierceRequest,
  PartialPID,
  Proctype,
  SolidRequest,
} from '@/constants.ts'
import { assert, expect, log } from '@utils'
import DB from '@/db.ts'
import { UnsequencedRequest } from '@/constants.ts'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { fixedRandomness } from '@/api/randomness.ts'
import { cradleMaker } from '@/cradle-maker.ts'

type PartialRequest = Omit<SolidRequest, 'target'>

const repoId = `rep_${fixedRandomness('exe-test')}`
const partialPid: PartialPID = {
  account: 'exe',
  repository: 'test',
  branches: ['main'],
}
const source = { ...partialPid, repoId, account: 'higher' }
const partialRequest: PartialRequest = {
  isolate: 'io-fixture',
  functionName: 'local',
  params: {},
  proctype: Proctype.enum.SERIAL,
  source,
  sequence: 0,
}
const mocks = async (initialRequest: PartialRequest) => {
  const db = await DB.create(DB.generateAesKey())
  let fs = await FS.init(partialPid, db)
  let io = await IOChannel.load(fs)
  const request = { ...initialRequest, target: fs.pid }
  io.addRequest(request)
  io.setExecution()
  io.save()
  const { next } = await fs.writeCommitObject('mock exe')
  fs = next
  io = await IOChannel.load(fs)
  const stop = () => db.stop()
  const exe = Executor.createCacheContext()
  const context: C = { db, exe }
  return { request, context, exe, io, fs, db, stop }
}
Deno.test('simple', async (t) => {
  const { request, context, exe, fs, stop } = await mocks(partialRequest)
  await t.step('no accumulations', async () => {
    const result = await exe.execute(request, fs.oid, context)
    assert('reply' in result)
    const { reply, fs: settledFs } = result
    expect(reply.target).toEqual(fs.pid)
    expect(reply.outcome).toEqual({ result: 'local reply' })
    expect(settledFs).toEqual(fs)
    expect(settledFs.isChanged).toBeFalsy()
  })
  stop()
})
Deno.test('writes', async (t) => {
  const write = {
    ...partialRequest,
    functionName: 'write',
    params: { path: 'test.txt', content: 'hello' },
  }
  const { request, context, exe, fs, stop } = await mocks(write)
  await t.step('single file', async () => {
    const result = await exe.execute(request, fs.oid, context)
    assert('reply' in result)
    const { reply, fs: settledFs } = result
    expect(reply.target).toEqual(fs.pid)
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

Deno.test('loopback', async () => {
  const compound = {
    ...partialRequest,
    functionName: 'compound',
    params: { target: source },
  }
  const { request, context, exe, fs, stop } = await mocks(compound)
  const result = await exe.execute(request, fs.oid, context)
  expect('pending' in result).toBeTruthy()
  stop()
})

Deno.test('compound', async (t) => {
  const target = {
    repoId: `rep_${fixedRandomness('compound')}`,
    account: 'exe',
    repository: 'other',
    branches: ['other'],
  }
  const compound = {
    isolate: 'io-fixture',
    proctype: Proctype.enum.SERIAL,
    source,
    sequence: 0,
    functionName: 'compound',
    params: { target },
  }
  const { request, context, exe, io, fs, stop } = await mocks(compound)
  let unsequenced: UnsequencedRequest
  await t.step('half done', async () => {
    const result = await exe.execute(request, fs.oid, context)
    expect(result).toHaveProperty('pending')
    assert('pending' in result)
    const { requests } = result.pending
    expect(requests).toHaveLength(1)
    unsequenced = requests[0]
    log('internalRequest', unsequenced)
    expect(unsequenced.target).toEqual(target)
  })
  await t.step('reply using function cache', async () => {
    const sequenced = io.addPending(0, fs.oid, [unsequenced])
    expect(sequenced).toHaveLength(1)
    const target = sequenced[0].source
    const reply = {
      target,
      source: target,
      outcome: { result: 'compound reply' },
      sequence: sequenced[0].sequence,
      commit: '9e77f98333897ce63bf993280994d5e96c1679ff',
    }

    const savedRequest = io.reply(reply)
    assert(!isPierceRequest(savedRequest))
    expect(savedRequest).toEqual(sequenced[0])
    io.setExecution()
    io.save()
    const { next } = await fs.writeCommitObject('function cache')

    const result = await exe.execute(request, next.oid, context)
    expect('reply' in result).toBeTruthy()
  })
  await t.step('reply from replay', async () => {
    assert(request)
    const io = await IOChannel.load(fs)
    const sequenced = io.addPending(0, fs.oid, [request])
    expect(sequenced).toHaveLength(1)
    const target = fs.pid
    const reply = {
      target,
      source: target,
      commit: '0088107ee2fe3d8350d64b8b0098081a3db08adc',
      outcome: { result: 'compound reply' },
      sequence: sequenced[0].sequence,
    }
    io.reply(reply)
    io.setExecution()
    io.save()
    const { next } = await fs.writeCommitObject('function replay')

    const c = { ...context, exe: Executor.createCacheContext() }
    const result = await c.exe.execute(request, next.oid, c)
    expect('reply' in result).toBeTruthy()
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

// TODO convert this to use the cradle maker

const provision = async (t: Deno.TestContext, withExeCache: boolean) => {
  const cradle = await cradleMaker(t, import.meta.url)
  if (!withExeCache) {
    assert(cradle.engine instanceof Engine)
    assert(cradle.engine.context.exe, 'exe should be defined')
    cradle.engine.context.exe.disableFunctionCache()
  }
  return cradle
}

for (const withExeCache of [true, false]) {
  Deno.test(`commit spanning (cache: ${withExeCache}`, async (t) => {
    await t.step(`function cache`, async () => {
      await using cradle = await provision(t, withExeCache)
      const { backchat } = cradle

      const { fileAccumulation } = await backchat.actions<Api>('io-fixture')
      await fileAccumulation({ path: 'test.txt', content: 'hello', count: 3 })

      let first
      for await (const splice of backchat.watch(backchat.pid, 'test.txt')) {
        first = splice
        break
      }
      assert(first)
      const file = first.changes['test.txt'].patch
      assert(file)
      log(file)
      expect(file.split('\n')).toHaveLength(7)
    })
  })

  Deno.test(`looping accumulation (cache: ${withExeCache}`, async (t) => {
    await t.step(`function cache ${withExeCache}`, async () => {
      await using cradle = await provision(t, withExeCache)
      const { backchat } = cradle

      const { pid } = backchat
      const { loopAccumulation } = await backchat.actions<Api>(
        'io-fixture',
        { target: pid },
      )
      await loopAccumulation({ path: 'test.txt', content: 'hello', count: 3 })

      let first
      for await (const splice of backchat.watch(pid, 'test.txt')) {
        first = splice
        break
      }
      assert(first)
      const file = first.changes['test.txt'].patch
      assert(file)
      log(file)
      expect(file.split('\n')).toHaveLength(9)
    })
  })
}

// verify that pierce cannot interrupt a running in band accumulation
// test repeat calling should not corrupt the cache, and should return the same,
// even if the commit was several accumulations ago
