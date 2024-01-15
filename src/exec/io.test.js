import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
import Debug from 'debug'
const isolate = 'io.fixture'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test('ping', async ({ artifact }) => {
  const actions = await artifact.actions(isolate)
  const result = await actions.local()
  expect(result).toBe('local reply')
  const second = await actions.local({})
  expect(second).toBe(result)
  await expect(() => actions.local('throwme')).rejects.toThrow(
    'Parameters Validation Error'
  )
})
test('child to self', async ({ artifact }) => {})
test('child to child', async ({ artifact }) => {})
test('child to parent', async ({ artifact }) => {})
test.only('child process', async ({ artifact }) => {
  const actions = await artifact.actions(isolate)
  const result = await actions.spawn({ isolate })
  expect(result).toBe('remote pong')
})
