import { expect } from '@utils'
import { partialFromRepo } from '@/constants.ts'
import IA from '../isolate-api.ts'
import { Api } from './load-agent.ts'
import DB from '@/db.ts'
import Compartment from '@io/compartment.ts'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { assert } from '@std/assert'

Deno.test('format checking', async (t) => {
  const compartment = await Compartment.create('load-agent')
  const db = await DB.create(DB.generateAesKey())
  const partial = partialFromRepo('agent/format')
  const fs = await FS.init(partial, db)
  const accumulator = Accumulator.create(fs)
  accumulator.activate(Symbol())
  const api = IA.create(accumulator)

  const path = 'agents/agent-fixture.md'
  await t.step('fixture', async () => {
    api.write(path, agentMd)
    const functions = compartment.functions<Api>(api)
    const agent = await functions.load({ path })
    assert(agent.config)
    expect(agent.config.model).toBe('gpt-3.5-turbo')
    expect(agent.runner).toBe('ai-runner')
    expect(agent.commands).toEqual(['io-fixture:local', 'io-fixture:error'])
    expect(agent.instructions).toEqual('ALWAYS be as brief as possible')
  })
  await t.step('no front-matter', async () => {
    api.write(path, 'HELLO')
    const functions = compartment.functions<Api>(api)
    const agent = await functions.load({ path })
  })
  // TODO test some erroneous config written

  db.stop()
})

const agentMd = `
---
config:
  model: gpt-3.5-turbo
commands:
  - io-fixture:local
  - io-fixture:error
done: 
examples:
tests:
---

ALWAYS be as brief as possible

`
