import { memfs } from 'https://esm.sh/memfs@4.6.0'
import { expect, log } from '@utils'
import * as git from './git.ts'
import { PID } from '@/artifact/constants.ts'

Deno.test('git', async (t) => {
  const { fs } = memfs()
  const pid: PID = { account: 'git', repository: 'test', branches: ['main'] }
  await t.step('init', async () => {
    // create a new repo
    // confirm the repo is as expected
    const _pid = await git.init(fs, 'git/test')
    expect(_pid).toEqual(pid)
    expect(fs.existsSync('/.git')).toBe(true)
  })
  // type Dispatch = {
  //   pid: PID
  //   isolate: string
  //   functionName: string
  //   params: Params
  //   proctype: PROCTYPE
  //   /**
  //    * This should be a globally unique identifier for the dispatch.  It is used
  //    * to provide updates to the dispatch as it is processed, and to allow updates
  //    * to be continued during recovery.
  //    */
  //   nonce: string
  //   /**
  //    * Where did this dispatch come from? If this is blank, then it was self
  //    * originated, but if it has a value, then the reply gets copied across to
  //    * that process branch.
  //    */
  //   source?: PID
  // }
  await t.step('serial', async () => {
    // take in a single action in the pool
    // observe it being commited
    // insert a result
    // observe it being commited
    // confirm the result is as expected
    const payload = {
      pid,
      isolate: 'test-isolate',
      functionName: 'test',
      params: {},
      proctype: 'SERIAL',
      nonce: '1',
    }
    const pool = [{ type: 'PIERCE', payload }]
    // ? who checks the permissions of what is allowed ?

  })
  await t.step('multiple serial requests', async () => {
    // demonstrate that multiple serial requests are processed
    // dispatch two local actions in the same pool
    // observe the result of both being commited in the same commit
  })
})
