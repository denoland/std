import { test, expect, debug } from '../test-context.js'
import Artifact from './artifact.js'

const isolate = 'engage-help'

test('boot', async ({ artifact }) => {
  expect(artifact).toBeInstanceOf(Artifact)
})
test('have a chat', async function ({ artifact }) {
  const help = 'empty.fixture'
  const { engage } = await artifact.actions(isolate)
  const result = await engage({ help, text: 'return an exclaimation mark' })
  expect(result.trim()).toEqual('!')
  const session = await artifact.read('/chat-1.session.json')
  const messages = JSON.parse(session)
  expect(messages.length).toEqual(2)
  const log = await artifact.log({ depth: 1 })
  expect(log.length).toEqual(1)
  expect(log[0].commit.message).toContain('replyIO')
})
test('curtains', async function ({ artifact }) {
  const help = 'curtains'
  const { engage } = await artifact.actions(isolate)
  const result = await engage({ help, text: 'hello' })
  expect(result.length).toBeGreaterThan(100)
  const session = await artifact.read('/chat-1.session.json')
  const messages = JSON.parse(session)
  expect(messages.length).toEqual(3)
})
test('curtains multi turn', async function ({ artifact }) {
  const help = 'curtains'
  const { engage } = await artifact.actions(isolate)
  await engage({ help, text: 'hello' })
  const result2 = await engage({ help, text: 'lounge' })
  expect(result2.length).toBeGreaterThan(100)
  const session = await artifact.read('/chat-1.session.json')
  const messages = JSON.parse(session)
  expect(messages.length).toEqual(5)
})
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
