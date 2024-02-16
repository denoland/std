import { Debug, expect, log } from '../utils.ts'
import { PID, PROCTYPE } from '@/artifact/constants.ts'
import Cradle from '../cradle.ts'

Debug.enable('*tests')
Deno.test('serial', async (t) => {
  const artifact = await Cradle.create()
  let pid!: PID
  await t.step('init', async () => {
    const initResult = await artifact.init({ repo: 'io/test' })
    pid = initResult.pid
  })
  expect(pid).toBeDefined()
  await t.step('parallel', async () => {
    const dispatches = await artifact.dispatches({ isolate: 'io-fixture', pid })
    const result = await dispatches.local({}, PROCTYPE.PARALLEL)
    expect(result).toBe('local reply')
  })
  // await t.step('serial', async () => {
  //   const dispatches = await artifact.dispatches({ isolate: 'io-fixture', pid })
  //   const result = await dispatches.local()
  //   expect(result).toBe('local reply')
  //   // TODO read the fs and see what the state of the file system is ?
  // })

  await artifact.stop()
})
