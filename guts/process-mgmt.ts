import { expect } from '@utils'
import { addBranches, CradleMaker } from '@/constants.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const repo = 'process/session'

    const { pid } = await backchat.init({ repo })
    const testBranch1Pid = addBranches(pid, 'session-1')
    const { create } = await backchat.actions('session', { target: pid })
    await t.step('create', async () => {
      const branchPid = await create()
      expect(branchPid).toEqual(testBranch1Pid)

      const opts = { target: testBranch1Pid }
      const { local } = await backchat.actions('io-fixture', opts)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('second session', async () => {
      const branchPid = await create()
      const testBranch3Pid = addBranches(pid, 'session-3')
      expect(branchPid).toEqual(testBranch3Pid)
      const opts = { target: testBranch3Pid }
      const { local } = await backchat.actions('io-fixture', opts)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await engine.stop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const { backchat, engine } = await cradleMaker()
    const repo = 'process/session'

    const { pid } = await backchat.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await backchat.actions('io-fixture', { target: pid })
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await engine.stop()
  })
}
