import { CradleMaker } from '@/constants.ts'
import { log } from '@utils'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':tps: '

  Deno.test(prefix + 'run fixture test', async (t) => {
    const { backchat, engine } = await cradleMaker(t)
    log('start')

    await t.step('run fixture', async () => {
      await backchat.prompt('run test ./tests/test-fixture.test.md')
    })

    await engine.stop()
  })
}
