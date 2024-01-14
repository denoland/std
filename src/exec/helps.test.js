import Debug from 'debug'
import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
})

test('execute ping by tool call', async function ({ artifact }) {
  await setupPingIO(artifact)
  const { prompt } = await artifact.goalUp()

  // ? only test the runner, not the stuckfinder
  const result = await prompt({ text: 'ping local' })
  // override the stuckfinder to return the ping stuck
  expect(result.trim()).toEqual('!')
  // test that in fact local was pinged
})
test.skip('help with no commands') // should be able to run anything really
test.only('run ping help directly', async ({ artifact }) => {
  Debug.enable('AI:help-runner')
  await setupRunner(artifact)
  await setupPingIO(artifact)
})

const setupRunner = async (artifact) => {
  const isolate = { codePath: '/hal/isolates/help-runner.js' }
  const path = '/runner.io.json'
  await artifact.createIO({ path, isolate })
}

const setupPingIO = async (artifact) => {
  const isolate = { codePath: '/hal/isolates/io.fixture.js' }
  const path = '/ping.io.json'
  await artifact.createIO({ path, isolate })
}
