import Debug from 'debug'
import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
Debug.enable('AI:engage-help, AI:runner-chat')
const isolate = 'engage-help'
const help = 'help.fixture'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
})

test('tool call', async function ({ artifact }) {
  const { engage } = await artifact.actions(isolate)
  const text = 'call the "local" function'
  const result = await engage({ help, text })
  expect(result).toContain('function was called')
})
test('error tool call', async function ({ artifact }) {
  const { engage } = await artifact.actions(isolate)
  const text = 'call the "error" function with the message: "bob"'
  await engage({ help, text })
  const io = await artifact.readIO()
  expect(io.inputs[1].name).toBe('error')
  expect(io.outputs[1].error.message).toBe('bob')
})
test.skip('help with no commands') // should be able to run anything really
test('chat', async ({ artifact }) => {
  const { engage } = await artifact.actions(isolate)
  const text = 'say a single "x" character and do not call any functions'
  const result = await engage({ help, text })
  expect(result).toEqual('x')
})
test.skip('add a file to the database')
