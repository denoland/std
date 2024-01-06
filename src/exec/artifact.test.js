// import 'fake-indexeddb/auto'
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

test.only('have a chat', async ({ artifact }) => {
  Debug.enable('AI*')
  const result = await artifact.prompt('return an exclaimation mark')
  expect(result.content).toEqual('!')
  const session = await artifact.read('/.session.json')
  const messages = JSON.parse(session)
  expect(messages.length).toEqual(2)
  const log = await artifact.log({ depth: 1 })
  expect(log.length).toEqual(1)
  expect(log[0].commit.message).toEqual('promptRunner\n')
})
test.skip('edit boot files')

test('add a file', async ({ artifact }) => {
  // await artifact.prompt('add a file named hello.txt')

  // check that the file was actually added and committed
  // a commit is the action of the AI, which has necessarily modified the fs

  const files = await artifact.ls()
  expect(files).toEqual(['hello.txt'])
  const contents = await artifact.read('hello.txt')
  expect(contents).toEqual('hello world')
})
