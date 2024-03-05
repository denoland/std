import { expect } from '@utils'
import { Cradle } from '../api/web-client.types.ts'

export default (name: string, cradleMaker: () => Promise<Cradle>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'process/session'
    const { pid } = await artifact.init({ repo })
    const sessionPid = { ...pid, branches: [...pid.branches, '0'] }
    await t.step('create', async () => {
      const { create } = await artifact.pierces('session', pid)
      const session = await create({}, { noClose: true })
      expect(session).toEqual(sessionPid)

      const { local } = await artifact.pierces('io-fixture', sessionPid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await artifact.stop()
  })
}
