import { expect, log } from '@utils'
import { ArtifactSession } from '../api/web-client.types.ts'
import { assert } from '@std/assert'

export default (name: string, cradleMaker: () => Promise<ArtifactSession>) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const artifact = await cradleMaker()

    log('pid', artifact.pid)
    expect(artifact.pid.branches).toHaveLength(2)

    const repo = 'process/session'
    await artifact.rm({ repo })
    const target = await artifact.init({ repo })

    // TODO exercise the ACL blocking some actions to the session chain
    await t.step('interact', async () => {
      const { local } = await artifact.actions('io-fixture', artifact.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    const second = await artifact.createSession()
    await t.step('second session', async () => {
      expect(second.pid.branches).toHaveLength(2)

      const { local } = await second.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    await t.step('cross session', async () => {
      assert(second)
      const { local } = await second.actions('io-fixture', artifact.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })

    const resumed = await artifact.createSession(artifact.pid)
    await t.step('resume session', async () => {
      expect(resumed.pid).toEqual(artifact.pid)
      const { local } = await resumed.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
      await resumed.stop()
    })
    await resumed.stop()
    await second.stop()
    await artifact.stop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'session/relay'
    await artifact.rm({ repo })

    const { pid } = await artifact.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await artifact.actions('io-fixture', pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await artifact.stop()
  })
}
