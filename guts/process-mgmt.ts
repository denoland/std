import { expect } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })

    const { pid } = await artifact.init({ repo })
    const sessionPid = { ...pid, branches: [...pid.branches, '1'] }
    const { create } = await artifact.pierces('session', pid)
    await t.step('create', async () => {
      const session = await create()
      expect(session).toEqual(sessionPid)

      const { local } = await artifact.pierces('io-fixture', sessionPid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('second session', async () => {
      const session = await create()
      const session2Pid = { ...pid, branches: [...pid.branches, '3'] }
      expect(session).toEqual(session2Pid)

      const { local } = await artifact.pierces('io-fixture', sessionPid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await artifact.stop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    await artifact.rm({ repo })

    const { pid } = await artifact.init({ repo })

    await t.step('ping', async () => {
      const isolate = 'io-fixture'
      const { branch } = await artifact.pierces(isolate, pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await artifact.stop()
  })
}
