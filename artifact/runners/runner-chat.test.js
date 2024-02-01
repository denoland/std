import API from '../api.js'
import runner from './runner-chat.js'
import { expect } from '../tst-helpers.js'

Deno.test('runner', async (t) => {
  const api = API.create()
  await api.pull({ repo: 'dreamcatcher-tech/HAL' })
  let help
  await t.step('load help file', async () => {
    help = await api.loadJSON({
      repo: 'dreamcatcher-tech/HAL',
      path: 'helps/help.fixture.json',
    })
    expect(help).toHaveProperty('instructions')
  })
  await t.step('chat', async () => {
    // need a little wrapper that gives it the isolated functions
    await runner({ help, text: 'hello' })
  })
})
