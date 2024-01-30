import { debug, expect, test } from '../test-context.js'

test('loadAll', async ({ artifact }) => {
  const { loadAll } = await artifact.actions('load-help')
  expect(loadAll).toBeInstanceOf(Function)
  const helps = await loadAll()
  expect(helps.length).toBeGreaterThan(5)
  expect(!helps.some((help) => help.name === 'README'))
})
test('load', async ({ artifact }) => {
  const { load } = await artifact.actions('load-help')
  const help = await load({ help: 'help.fixture' })
  expect(help).toHaveProperty('runner', 'runner-chat')
  expect(help).toHaveProperty('instructions')
})
