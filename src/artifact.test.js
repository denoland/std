import Artifact from './artifact'
import { afterEach, expect, test, beforeEach } from 'vitest'
import filesystem from 'fs'

beforeEach(async (context) => {
  await filesystem.promises.mkdir('./tmp').catch(() => {})
  const path = await filesystem.promises.mkdtemp('./tmp/')
  context.path = path
  context.artifact = await Artifact.boot({ path, filesystem })
  // TODO make artifact boot in a sequence of functions
  // so it can be done in the play area of storybook
})
afterEach(async (context) => {
  await filesystem.promises.rmdir(context.path, { recursive: true })
})

test('boot', async ({ artifact }) => {
  expect(artifact).toBeInstanceOf(Artifact)
})

test.only('have a chat', async ({ artifact }) => {
  await artifact.prompt('hello world')
  //
})

test('add a file', async ({ artifact }) => {
  await artifact.prompt('add a file named hello.txt')

  // check that the file was actually added and committed
  // a commit is the action of the AI, which has necessarily modified the fs

  const files = await artifact.ls()
  expect(files).toEqual(['hello.txt'])
  const contents = await artifact.read('hello.txt')
  expect(contents).toEqual('hello world')
})
