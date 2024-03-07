// import { _debug, expect, test } from '../../../artifact/tst-helpers.js'
// import Artifact from './artifact.js'

// const isolate = 'engage-help'

// test('boot', async ({ artifact }) => {
//   expect(artifact).toBeInstanceOf(Artifact)
// })
// test('have a chat', async function ({ artifact }) {
//   const help = 'empty-fixture'
//   const { engageInBand } = await artifact.actions(isolate)
//   const result = await engageInBand({ help, text: 'return a "!"' })
//   expect(result.trim()).toEqual('!')
//   const session = await artifact.read('/chat-1.session.json')
//   const messages = JSON.parse(session)
//   expect(messages.length).toEqual(2)
//   const log = await artifact.log({ depth: 1 })
//   expect(log.length).toEqual(1)
//   expect(log[0].commit.message).toContain('replyIO')
// })
// test.skip('edit boot files')

// test('add a file', async ({ artifact }) => {
//   const help = 'files'
//   const { engageInBand } = await artifact.actions(isolate)
//   const result = await engageInBand({
//     help,
//     text: 'add a file named hello.txt',
//   })
//   expect(typeof result).toBe('string')
//   const files = await artifact.ls()
//   expect(files).toContain('hello.txt')

//   await engageInBand({ help, text: 'write "hello world" to it' })
//   const file = await artifact.read('/hello.txt')
//   expect(file).toEqual('hello world')

//   await engageInBand({ help, text: "replace all the o's with p's" })
//   const file2 = await artifact.read('/hello.txt')
//   expect(file2).toEqual('hellp wprld')

//   await engageInBand({ help, text: 'now blank it' })
//   const file3 = await artifact.read('/hello.txt')
//   expect(file3).toEqual('')
// })

// test.skip('i want to make a bot')
// test.skip('i want to import this database file into my crm records')
