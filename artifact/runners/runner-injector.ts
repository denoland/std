import equal from 'https://esm.sh/fast-deep-equal'
import debug from '$debug'
import runner from './runner-chat.ts'
import { Help } from '@/artifact/constants.ts'
import { IsolateApi } from '@/artifact/constants.ts'

const log = debug('AI:runner-injector')

type Args = { help: Help; text: string }
export default async ({ help: injectee, text }: Args, api: IsolateApi) => {
  log('injector:', injectee, text)

  const { loadAll } = await api.isolateActions('load-help')
  const allHelps: Help[] = await loadAll()
  const helps = allHelps.filter((help) => !equal(help, injectee))

  injectee = { ...injectee }
  injectee.instructions = [...injectee.instructions]
  for (const donor of helps) {
    // TODO include the commands api descriptions too
    injectee.instructions.push(JSON.stringify(donor, null, 2))
  }
  log('injectee', injectee)
  return runner({ help: injectee, text }, api)
}
