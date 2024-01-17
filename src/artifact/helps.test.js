import Debug from 'debug'
import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot({ wipe: true })
})

// test('execute ping by tool call', async function ({ artifact }) {
//   await setupPingIO(artifact)
//   const { prompt } = await artifact.goalUp()

//   // ? only test the runner, not the stuckfinder
//   const result = await prompt({ text: 'ping local' })
//   // override the stuckfinder to return the ping stuck
//   expect(result.trim()).toEqual('!')
//   // test that in fact local was pinged
// })
test.skip('help with no commands') // should be able to run anything really
test.only('chat', async ({ artifact }) => {
  const isolate = 'engage-help'
  const { engage } = await artifact.actions(isolate)
  Debug.enable('AI:engage-help')
  // the engager should do spawn, daemon, etc as a function call
  const text = 'say a single "x" character with no whitespace or anything'
  const result = await engage({ help: 'help.fixture', text })
  expect(result).toEqual('x')
})
test.skip('add a file to the database')

// test('spawn', async ({ artifact }) => {
//   // spawn creates a new branch and executes the function
//   const isolate = { codePath: '/hal/isolates/help-runner.js' }
//   const name = 'engage'
//   const parameters = { help: 'ping.fixture' }
//   const result = await artifact.spawn({ isolate, name, parameters })
//   console.log(result)
//   expect(result).toEqual('ping.fixture')
// })
