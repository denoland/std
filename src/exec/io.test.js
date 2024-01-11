import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
import { api } from './isolate-ping.fixture'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test('ping', async ({ artifact }) => {
  // ? how does this relate to stucks and discoveries ?
  // stucks would be just another type of code that loads ?
  artifact.overloadExecutable('/ping.fixture.js', './isolate-ping.fixture.js')
  const isolate = {
    codePath: '/ping.fixture.js',
    type: 'function',
    language: 'javascript',
    api,
  }
  const path = '/ping.io.json'
  await artifact.createIO({ path, isolate })
  const actions = await artifact.actions('/ping.io.json')
  const result = await actions.local({})
  expect(result).toBe('local reply')
  const second = await actions.local({})
  expect(second).toBe(result)
})
