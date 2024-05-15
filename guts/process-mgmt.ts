import { expect } from '@utils'
import { CradleMaker } from '@/constants.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const session = await cradleMaker()
    const repo = 'process/session'

    const { pid } = await session.init({ repo })
    const testBranch1Pid = { ...pid, branches: [...pid.branches, 'session-1'] }
    const { create } = await session.actions('session', pid)
    await t.step('create', async () => {
      const branchPid = await create()
      expect(branchPid).toEqual(testBranch1Pid)

      const { local } = await session.actions('io-fixture', testBranch1Pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('second session', async () => {
      const branchPid = await create()
      const testBranch3Pid = {
        ...pid,
        branches: [...pid.branches, 'session-3'],
      }
      expect(branchPid).toEqual(testBranch3Pid)

      const { local } = await session.actions('io-fixture', testBranch3Pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await session.rm({ repo })
    await session.engineStop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const session = await cradleMaker()
    const repo = 'process/session'
    await session.rm({ repo })

    const { pid } = await session.init({ repo })

    await t.step('ping', async () => {
      const isolate = 'io-fixture'
      const { branch } = await session.actions(isolate, pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await session.engineStop()
  })
}
