import Artifact from './artifact'
import { expect, test, beforeEach } from 'vitest'
import Debug from 'debug'

beforeEach(async (context) => {
  context.artifact = await Artifact.boot()
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})

test('boot', async ({ artifact }) => {
  expect(artifact).toBeInstanceOf(Artifact)
})
test('have a chat', async function ({ artifact }) {
  artifact.overloadExecutable('/hal/isolates/chat.js', '../isolates/chat.js')
  const { prompt } = await artifact.chatUp()
  const result = await prompt({ text: 'return an exclaimation mark' })
  expect(result.content.trim()).toEqual('!')
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

/**
 * Tooling:
 * - glob mapper, where it runs a function on each file
 * - sys prompt editing
 * - relay (simply passes actions thru to another io channel)
 */
