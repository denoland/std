import equal from 'https://esm.sh/fast-deep-equal'
import debug from '$debug'
import runner from './runner-chat.ts'

const log = debug('AI:runner-injector')

type Args = { help: object; text: string }
export default async ({ help: injectee, text }: Args) => {
  log('injector:', injectee, text)

  const { loadAll } = await hooks.actions('load-help')
  const allHelps = await loadAll()
  const helps = allHelps.filter(({ help: Help }) => !equal(help, injectee))

  injectee = { ...injectee }
  injectee.instructions = [...injectee.instructions]
  for (const donor of helps) {
    // TODO include the commands api descriptions too
    injectee.instructions.push(JSON.stringify(donor, null, 2))
  }
  log('injectee', injectee)
  return runner({ help: injectee, text })
}
