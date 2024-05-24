import { expect } from '@utils'
import { Engine } from '../engine.ts'
import { partialFromRepo } from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import { Api } from '@/isolates/load-help.ts'
import { Machine } from '@/api/web-client-machine.ts'
import DB from '@/db.ts'
import Compartment from '@io/compartment.ts'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { assert } from '@std/assert'
Deno.test('loadAll', async (t) => {
  const superuserKey = Machine.generatePrivateKey()
  const aesKey = DB.generateAesKey()
  const engine = await Engine.provision(superuserKey, aesKey)
  const machine = Machine.load(engine, Machine.generatePrivateKey())
  const terminal = machine.openTerminal()
  const { pid } = await terminal.clone({ repo: 'dreamcatcher-tech/HAL' })
  const { loadAll, load } = await terminal.actions<Api>('load-help', pid)
  await t.step('load', async () => {
    const help = await load({ help: 'help-fixture' })
    expect(help).toHaveProperty('runner', 'ai-prompt')
    expect(help).toHaveProperty('instructions')
  })
  await t.step('loadAll', async () => {
    expect(loadAll).toBeInstanceOf(Function)
    const helps = await loadAll()
    expect(helps.length).toBeGreaterThan(5)
  })
  await terminal.engineStop()
})

Deno.test('format checking', async (t) => {
  const loader = await Compartment.create('load-help')
  const db = await DB.create(DB.generateAesKey())
  const partial = partialFromRepo('help/format')
  const fs = await FS.init(partial, db)
  const accumulator = Accumulator.create(fs)
  accumulator.activate(Symbol())
  const api = IsolateApi.create(accumulator)

  await t.step('fixture', async () => {
    api.write('helps/help-fixture.md', mdHelp)
    const functions = loader.functions<Api>(api)
    const help = await functions.load({ help: 'help-fixture' })
    assert(help.config)
    expect(help.config.model).toBe('gpt-3.5-turbo')
    expect(help.runner).toBe('ai-prompt')
    expect(help.commands).toEqual(['io-fixture:local', 'io-fixture:error'])
    expect(help.instructions).toEqual('ALWAYS be as brief as possible')
  })
  await t.step('no front-matter', async () => {
    api.write('helps/help-fixture.md', 'HELLO')
    const functions = loader.functions<Api>(api)
    const help = await functions.load({ help: 'help-fixture' })
    console.dir(help, { depth: 10 })
  })
  await t.step('blank file throws', async () => {
    api.write('helps/help-fixture.md', '')
    const functions = loader.functions<Api>(api)
    await expect(functions.load({ help: 'help-fixture' })).rejects
      .toThrow('content missing')
  })

  db.stop()
})

const mdHelp = `
---
config:
  model: gpt-3.5-turbo
runner: ai-prompt
commands:
  - io-fixture:local
  - io-fixture:error
done: 
examples:
tests:
---

ALWAYS be as brief as possible

`
