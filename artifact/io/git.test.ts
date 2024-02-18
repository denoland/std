import { memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '@utils'
import * as git from './git.ts'
import { IoStruct, PID, PROCTYPE, Request } from '@/artifact/constants.ts'
import IsolateApi from '@/artifact/isolate-api.ts'
import { Reply } from '@/artifact/constants.ts'

Deno.test('git', async (t) => {
  const { fs } = memfs()
  const target: PID = { account: 'git', repository: 'test', branches: ['main'] }
  await t.step('init', async () => {
    const _pid = await git.init(fs, 'git/test')
    expect(_pid).toEqual(target)
    expect(fs.existsSync('/.git')).toBe(true)
  })
  await t.step('pierce', async () => {
    const request: Request = {
      target,
      source: { nonce: 'test-nonce' },
      isolate: 'test-isolate',
      functionName: 'test',
      params: {},
      proctype: PROCTYPE.SERIAL,
    }
    Debug.enable('AI:git *tests')
    await git.solidifyPool(fs, [request])
    const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.inputs[0]).toEqual(request)
  })
  await t.step('pierce reply', async () => {
    const reply: Reply = {
      target,
      source: target,
      sequence: 0,
      outcome: { result: 'test-result' },
    }
    await git.solidifyPool(fs, [reply])
    const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
    log('io', io)
    expect(io.sequence).toBe(1)
    expect(io.outputs[0]).toEqual(reply.outcome)
  })
  await t.step('second action blanks io', async () => {
    const request: Request = {
      target,
      source: { nonce: 'test-nonce-2' },
      isolate: 'test-isolate',
      functionName: 'test',
      params: {},
      proctype: PROCTYPE.SERIAL,
    }
    await git.solidifyPool(fs, [request])
    const io: IoStruct = JSON.parse(fs.readFileSync('/.io.json').toString())
    log('io', io)
    expect(io.sequence).toBe(2)
    expect(io.inputs[0]).toBeUndefined()
    expect(io.inputs[1]).toEqual(request)
    expect(io.outputs[0]).toBeUndefined()
  })
  await t.step('multiple serial requests', async () => {
    // demonstrate that multiple serial requests are processed
    // dispatch two local actions in the same pool
    // observe the result of both being commited in the same commit
  })
})
// next dispatches blank the io of outputs but leave unreplied items

// process with feedback
// process with additional actions received within it
// long running process that doesn't end
// daemon start
// daemon handover - like nohup

// duplicate actions in the pool are rejected
// permissioning for inclusion in the pool
