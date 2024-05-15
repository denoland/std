import { expect, log } from '@utils'
import { CradleMaker, print } from '@/constants.ts'
import { Machine } from '@/api/web-client-machine.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ': '
  Deno.test(prefix + 'session', async (t) => {
    const session = await cradleMaker()
    log('pid', print(session.pid))

    const repo = 'sessions/basic'
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
      // TODO this should check if the session is valid
      expect(resumed.pid).toEqual(session.pid)
      const { local } = await resumed.actions('io-fixture', target.pid)
      const result = await local()
      expect(result).toEqual('local reply')
    })
    // test a session resume to a non existent PID
    await Promise.all([resumed.stop(), second.stop(), session.stop()])
    await session.engineStop()
  })
  Deno.test(prefix + 'internal requests', async (t) => {
    const session = await cradleMaker()
    const repo = 'sessions/relay'

    const { pid } = await session.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await session.actions('io-fixture', pid)
      const result = await branch()
      expect(result).toEqual('remote pong')
    })

    await session.engineStop()
  })
  Deno.test(prefix + 'machine reload', async () => {
    // TODO this test should not pass - it should not request a new session
    const session = await cradleMaker()
    const machine = session.machine as Machine
    log.enable('AI:qbr AI:engine AI:tests')
    const next = machine.clone()
    expect(next.pid).toEqual(machine.pid)
    log('cloned')
    const nextRootSession = await next.rootSessionPromise
    log('starting ping')
    await nextRootSession.ping()
    await session.engineStop()
  })
}
