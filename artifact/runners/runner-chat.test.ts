import Cradle from '../cradle.ts'
import { expect, log } from '../tst-helpers.js'
import IsolateApi from '../isolate-api.ts'
import { Help, PID } from '../constants.ts'
import runner from './runner-chat.ts'

Deno.test('runner', async (t) => {
  const help: Help = {
    config: {
      model: 'gpt-3.5-turbo-1106',
    },
    runner: 'runner-chat',
    commands: ['io-fixture:local', 'io-fixture:error'],
    instructions: ['ALWAYS be as brief as possible'],
  }
  const text = 'hello'
  const api = IsolateApi.create()
  const result = await runner({ help, text }, api)
  log('result', result)
})

Deno.test.ignore('artifact', async (t) => {
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
