import merge from 'npm:lodash.merge'
import Cradle from '../cradle.ts'
import { expect, log } from '@utils'
import IsolateApi from '../isolate-api.ts'
import { Help, PID } from '../constants.ts'
import runner from './runner-chat.ts'

Deno.test('runner', async (t) => {
  const helpBase: Help = {
    config: {
      model: 'gpt-3.5-turbo-1106',
    },
    runner: 'runner-chat',
    commands: ['io-fixture:local', 'io-fixture:error'],
    instructions: ['Only reply with a SINGLE word'],
  }
  const api = IsolateApi.create()
  await t.step('hello world', async () => {
    const help = merge({}, helpBase, { commands: [] })
    const text = 'reply with the cheese emoji'
    const result = await runner({ help, text }, api)
    expect(result).toBe('🧀')
    log('result', result)
  })
  await t.step('tool call', async () => {
    const text = 'call the "local" function'
    const help = merge({}, helpBase, {
      instructions: ['return the function call results verbatim'],
    })
    const result = await runner({ help, text }, api)
    expect(result).toContain('"local reply"')
  })
  await t.step('tool error', async () => {
    const text = 'call the "error" function with message: salami'
    const help = merge({}, helpBase, {
      instructions: ['return the function call results verbatim'],
    })
    const result = await runner({ help, text }, api)
    expect(result).toContain('"salami"')
    // TODO read the filesystem and get the error message out
  })
})

Deno.test('artifact', async (t) => {
  const repo = 'dreamcatcher-tech/HAL'
  const artifact = await Cradle.create()
  await artifact.clone({ repo })

  await t.step('load help file', async () => {
    // this should only be able to be called relative to a commit
    // this should use splices
    // const help = await artifact.loadJSON({
    //   repo,
    //   path: 'helps/help.fixture.json',
    // })
    // expect(help).toHaveProperty('instructions')
  })
  await t.step('chat', async () => {
    const pid: PID = {
      account: 'dreamcatcher-tech',
      repository: 'HAL',
      branches: ['main'],
    }
    const isolate = 'engage-help'
    const { engageInBand } = await artifact.pierces(isolate, pid)
    const result = await engageInBand({
      help: 'help.fixture',
      text: 'hello',
    })
    log('result', result)
  })
  await artifact.stop()
})
