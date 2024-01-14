import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
import Debug from 'debug'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test('ping', async ({ artifact }) => {
  const { api } = await import('../isolates/io.fixture')
  const isolate = {
    codePath: '/hal/isolates/io.fixture.js',
    type: 'function',
    language: 'javascript',
    api,
  }
  const path = '/ping.io.json'
  await artifact.createIO({ path, isolate })
  const actions = await artifact.actions('/ping.io.json')
  const result = await actions.local()
  expect(result).toBe('local reply')
  const second = await actions.local({})
  expect(second).toBe(result)
})
test('child process', async ({ artifact }) => {
  const { api } = await import('../isolates/io.fixture')
  const isolate = {
    codePath: '/hal/isolates/io.fixture.js',
    type: 'function',
    language: 'javascript',
    api,
  }
  const path = '/ping.io.json'
  await artifact.createIO({ path, isolate })
  await artifact.createIO({ path: '/pong.io.json', isolate })
  const actions = await artifact.actions(path)
  const result = await actions.ping()
  expect(result).toBe('remote pong')
})
