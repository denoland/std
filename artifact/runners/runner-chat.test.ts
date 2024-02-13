import Cradle from '../cradle.ts'
import { expect, log } from '../tst-helpers.js'
import IsolateApi from '../isolate-api.ts'
import Compartment from '@io/compartment.ts'
import { PID } from '../constants.ts'

Deno.test('runner', async (t) => {
  const repo = 'dreamcatcher-tech/HAL'
  const artifact = await Cradle.create()
  await artifact.clone({ repo })

  await t.step('load help file', async () => {
    // this should only be able to be called relative to a commit
    // const help = await artifact.loadJSON({
    //   repo,
    //   path: 'helps/help.fixture.json',
    // })
    // expect(help).toHaveProperty('instructions')
  })
  await t.step('chat', async () => {
    const pid: PID = {
      account: 'dreamcatcher-tech',
      repository: 'HAL',
      branches: ['main'],
    }
    const isolate = 'engage-help'
    const { engageInBand } = await artifact.dispatches({ isolate, pid })
    const result = await engageInBand({
      help: 'help.fixture',
      text: 'hello',
    })
    log('result', result)
  })
  await artifact.stop()
})
