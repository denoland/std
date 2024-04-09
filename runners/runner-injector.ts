import equal from 'https://esm.sh/fast-deep-equal'
import { Debug } from '@utils'
import runner from './runner-chat.ts'
import { Help } from '@/constants.ts'
import { IsolateApi } from '@/constants.ts'
import * as loadHelp from '@/isolates/load-help.ts'
const log = Debug('AI:runner-injector')

type Args = { help: Help; text: string }
export default async (params: Args, api: IsolateApi) => {
  const { help, text } = params
  log('injector:', help, text)

  const { loadAll } = await api.functions<loadHelp.Api>('load-help')
  const allHelps = await loadAll()
  const helps: Help[] = allHelps.filter((h) => !equal(h, help))

  const injectee = { ...help }
  injectee.instructions = [...injectee.instructions]
  for (const donor of helps) {
    // TODO include the commands api descriptions too
    injectee.instructions.push(JSON.stringify(donor, null, 2))
  }
  log('injectee', injectee)
  return runner({ help: injectee, text }, api)
}
