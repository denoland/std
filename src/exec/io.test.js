import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
import Debug from 'debug'
const debug = Debug('test')
const api = {
  ping: {
    type: 'object',
    properties: { url: { type: 'string' } },
    // these could specify named exports, or fallback to default export
  },
  local: {
    type: 'object',
    properties: {},
  },
}

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test.only('ping', async ({ artifact }) => {
  artifact.subscribe('/hal/ping.io.json', (data) => {
    // console.log('io', data)
  })
  await artifact.subscribeCommits('/hal', (hash) => {
    console.log('commit', hash)
  })
  await artifact.subscribeCommits('/hal/ping.io.json', (file) => {
    console.log('file', file)
  })

  // ? how does this relate to stucks and discoveries ?
  // stucks would be just another type of code that loads ?

  artifact.overloadExecutable('/hal/ping.fixture.js', './io.fixture.js')

  const isolate = {
    code: '/hal/ping.fixture.js',
    type: 'function',
    language: 'javascript',
    api,
  }
  const path = '/hal/ping.io.json'
  await artifact.createIO({ path, isolate })
  const actions = await artifact.actions('/hal/ping.io.json')
  // const result = await actions.ping({ url: 'https://google.com' })
  const result = await actions.local({})
  expect(result).toBe('local reply')
  const second = await actions.local({})
  expect(second).toBe(result)
})
