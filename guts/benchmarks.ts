import { expect, log } from '@utils'
import { Artifact } from '../api/web-client.types.ts'
import { assert } from '@std/assert'

const ioFixture = 'io-fixture'
export default (name: string, cradleMaker: () => Promise<Artifact>) => {
  const prefix = name + ': '

  Deno.test(prefix + 'resource hogging', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })
    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.actions(ioFixture, target)

    await t.step('serial', async () => {
      log.enable('AI:qex*')
      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local())
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')

      // TODO get historical splices and confirm depth of actions

      await artifact.stop()
    })
  })
  Deno.test(prefix + 'resource hogging parallel', async (t) => {
    const artifact = await cradleMaker()
    const repo = 'cradle/pierce'
    await artifact.rm({ repo })

    const { pid: target } = await artifact.init({ repo })
    const { local } = await artifact.actions(ioFixture, target)
    await t.step('parallel', async () => {
      log.enable('AI:q*')

      const promises = []
      const count = 20
      for (let i = 0; i < count; i++) {
        promises.push(local({}, { branch: true }))
      }
      log('promises start')
      const results = await Promise.all(promises)
      for (const result of results) {
        expect(result).toBe('local reply')
      }
      log('done')
    })
    await artifact.stop()
  })
  Deno.test.ignore(prefix + 'flare', async (t) => {
    const artifact = await cradleMaker()
    const repo = 't/flare'
    await artifact.rm({ repo })

    const { pid: target } = await artifact.init({ repo })
    const { parallel, squared } = await artifact.actions(ioFixture, target)

    // log.enable('AI:q* AI:tests')
    await t.step('flare', async () => {
      const count = 50

      const results = await parallel({ count })
      expect(results).toHaveLength(count)
      assert(Array.isArray(results))
      for (const result of results) {
        expect(result).toBe('local reply')
      }
    })
    await t.step('flare squared', async () => {
      const count = 50
      const multiplier = 50

      const results = await squared({ count, multiplier })
      expect(results).toHaveLength(multiplier)
      assert(Array.isArray(results))
      for (const result of results) {
        expect(result).toHaveLength(count)
        assert(Array.isArray(result))
        for (const subresult of result) {
          expect(subresult).toBe('local reply')
        }
      }
    })
    await artifact.stop()
  })
}
