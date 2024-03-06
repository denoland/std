import { Debug, expect } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    const { pid } = await artifact.init({ repo })
    const sessionPid = { ...pid, branches: [...pid.branches, '0'] }
    const { create } = await artifact.pierces('session', pid)
    await t.step('create', async () => {
      const session = await create({}, { noClose: true })
      expect(session).toEqual(sessionPid)

      const { local } = await artifact.pierces('io-fixture', sessionPid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('second session', async () => {
      const session = await create({}, { noClose: true })
      const session2Pid = { ...pid, branches: [...pid.branches, '1'] }
      expect(session).toEqual(session2Pid)

      const { local } = await artifact.pierces('io-fixture', sessionPid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await artifact.stop()
  })
  Deno.test.only(prefix + 'internal requests', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    const { pid } = await artifact.init({ repo })

    await t.step('ping', async () => {
      const isolate = 'io-fixture'
      const { branch } = await artifact.pierces(isolate, pid)
      Debug.enable('AI:isolateApi AI:exe')
      const result = await branch({ isolate })
      expect(result).toEqual('remote pong')
    })

    await artifact.stop()
  })
}
