import Debug from 'debug'
import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test('boot', async ({ artifact }) => {
  expect(artifact).toBeInstanceOf(Artifact)
})
test('have a chat', async function ({ artifact }) {
  const { prompt } = await artifact.chatUp()
  const result = await prompt({ text: 'return an exclaimation mark' })
  expect(result.trim()).toEqual('!')
  const session = await artifact.read('/chat-1.session.json')
  const messages = JSON.parse(session)
  expect(messages.length).toEqual(3)
  const log = await artifact.log({ depth: 1 })
  expect(log.length).toEqual(1)
  expect(log[0].commit.message.startsWith('Reply: ')).toBeTruthy()
}, 10000)
test.skip('edit boot files')

test('add a file', async ({ artifact }) => {
  // await artifact.prompt('add a file named hello.txt')
  // check that the file was actually added and committed
  // a commit is the action of the AI, which has necessarily modified the fs
  // const files = await artifact.ls()
  // expect(files).toEqual(['hello.txt'])
  // const contents = await artifact.read('hello.txt')
  // expect(contents).toEqual('hello world')
})

Debug.enable('AI:*')
test('reset session', async ({ artifact }) => {
  const { prompt } = await artifact.goalUp()
  const result = await prompt({ text: 'reset my session' })
  // it should double check if thats what you want
  // it should ask if you want to delete the current session, or just start a
  // new one and keep the old one

  // go into the stuckloop to find what the best looking help is
  // this function can be arbitrarily complex, or simple.

  // be able to edit and refine how the stuckloop works, and wire up different
  // models

  // so make a function that is stuck-rag

  // then make a function that is post a stuck

  // then publish the stucks to the internet
})

/**
 * Tooling:
 * - glob mapper, where it runs a function on each file
 * - sys prompt editing
 * - relay (simply passes actions thru to another io channel)
 */
