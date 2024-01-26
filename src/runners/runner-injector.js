import equal from 'fast-deep-equal'
import Debug from 'debug'
import runner from './runner-chat.js'
import assert from 'assert-fast'
import * as hooks from '../artifact/io-hooks.js'

const debug = Debug('AI:runner-injector')

export default async ({ help: injectee, text }) => {
  assert(typeof injectee == 'object', `not object: ${typeof injectee}`)
  assert(typeof text === 'string', 'text must be a string')
  debug('injector:', injectee, text)

  const { loadAll } = await hooks.actions('load-help')
  const allHelps = await loadAll()
  const helps = allHelps.filter(({ help }) => !equal(help, injectee))

  injectee = { ...injectee }
  injectee.instructions = [...injectee.instructions]
  for (const donor of helps) {
    // TODO include the commands api descriptions too
    injectee.instructions.push(JSON.stringify(donor, null, 2))
  }
  debug('injectee', injectee)
  return runner({ help: injectee, text })
}
