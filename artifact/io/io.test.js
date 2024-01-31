import { debug } from '../tst-helpers.js'
const isolate = 'io.fixture'

test('ping', async ({ artifact }) => {
  const actions = await artifact.actions(isolate)
  const result = await actions.local()
  expect(result).toBe('local reply')
  const second = await actions.local({})
  expect(second).toBe(result)
  const msg = 'Parameters Validation Error'
  await expect(() => actions.local('throwme')).rejects.toThrow(msg)
})
test('child to self', async ({ artifact }) => {})
test('child to child', async ({ artifact }) => {})
test('child to parent', async ({ artifact }) => {})
test('child process', async ({ artifact }) => {
  const actions = await artifact.actions(isolate)
  const result = await actions.spawn({ isolate })
  expect(result).toBe('remote pong')
})
