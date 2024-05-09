import { expect, log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { print } from '@/constants.ts'

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const session = await cradleMaker()
    log('pid', print(session.pid))

    const repo = 'process/session'
    const target = await session.init({ repo })

    // TODO exercise the ACL blocking some actions to the session chain
    await t.step('interact', async () => {
      const { local } = await session.actions('io-fixture', session.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    const second = session.newSession()
    await t.step('second session', async () => {
      const { local } = await second.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('cross session', async () => {
      const { local } = await second.actions('io-fixture', session.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })

    const resumed = session.resumeSession(session.pid)
    await t.step('resume session', async () => {
      expect(resumed.pid).toEqual(session.pid)
      const { local } = await resumed.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await Promise.all([resumed.stop(), second.stop(), session.stop()])
    await session.engineStop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'session/relay'

    const { pid } = await artifact.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await artifact.actions('io-fixture', pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await artifact.rm({ repo })
    await artifact.engineStop()
  })
}
