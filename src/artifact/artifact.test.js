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
  debug.enable('AI:engage-help, AI:runner-chat AI:*part')
  const help = 'files'
  const { engage } = await artifact.actions(isolate)
  const result = await engage({ help, text: 'add a file named hello.txt' })
  expect(typeof result).toBe('string')
  const files = await artifact.ls()
  expect(files).toContain('hello.txt')

  await engage({ help, text: 'write "hello world" to it' })
  const file = await artifact.read('/hello.txt')
  expect(file).toEqual('hello world')

  await engage({ help, text: "replace all the o's with p's" })
  const file2 = await artifact.read('/hello.txt')
  expect(file2).toEqual('hellp wprld')

  await engage({ help, text: 'now blank it' })
  const file3 = await artifact.read('/hello.txt')
  expect(file3).toEqual('')
})

/**
 * Tooling:
 * - glob mapper, where it runs a function on each file
 * - sys prompt editing
 * - relay (simply passes actions thru to another io channel)
 */

test.skip('i want to make a bot')
test.skip('i want to import this database file into my crm records')
