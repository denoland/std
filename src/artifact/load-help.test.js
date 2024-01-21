import { test, expect } from 'vitest'
import { load, loadDir, loadHelps } from './load-help.js'
test('load all helps', async () => {
  const help = await load('help.fixture')
  expect(help).toHaveProperty('runner', 'runner-chat')
  expect(help).toHaveProperty('instructions')
})
test('load all helps', async () => {
  const helps = await loadHelps()
  expect(helps.length).toBeGreaterThan(5)
})

test('load all helps raw', async () => {
  const helps = await loadDir()
  expect(helps.length).toBeGreaterThan(5)
  expect(helps.some((help) => help.name === 'README.md'))
})
