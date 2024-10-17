import { CradleMaker } from '@/constants.ts'
import { log } from '@utils'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'tps: '

  Deno.test(prefix + 'run fixture test', async (t) => {
    const { backchat, engine } = await cradleMaker(t, import.meta.url)
    log('start')

    await t.step('run fixture', async () => {
      await backchat.prompt('run test ./tests/test-fixture.test.md')
    })

    await engine.stop()
  })
}
