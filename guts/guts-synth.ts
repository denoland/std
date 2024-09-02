import { CradleMaker } from '@/constants.ts'
import { log } from '@utils'

export default (name: string, cradleMaker: CradleMaker) => {
  const prefix = name + ':synth: '

  Deno.test(prefix + 'run fixture test', async (t) => {
    log.enable('AI:tests AI:synth AI:longthread')
    const { backchat, engine } = await cradleMaker()
    log('start')

    await t.step('run fixture', async () => {
      await backchat.prompt('run test ./tests/test-fixture.test.md')
    })

    await engine.stop()
  })
}
