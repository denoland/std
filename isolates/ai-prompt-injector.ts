import { Debug, equal } from '@utils'
import { api, functions as base } from './ai-prompt.ts'
import { Agent } from '@/constants.ts'
import { IsolateApi } from '@/constants.ts'
import * as loadHelp from '@/isolates/load-help.ts'
const log = Debug('AI:prompt-injector')

type Args = { help: Agent; text: string }

export { api }

export const functions = {
  prompt: async (params: Args, api: IsolateApi) => {
    const { help, text } = params
    log('injector:', help, text)

    const { loadAll } = await api.functions<loadHelp.Api>('load-help')
    const allHelps = await loadAll()
    const helps: Agent[] = allHelps.filter((h) => !equal(h, help))

    const injectee = { ...help }
    for (const donor of helps) {
      // TODO include the commands api descriptions too
      injectee.instructions += '\n' + JSON.stringify(donor, null, 2)
    }
    log('injectee', injectee)
    return base.prompt({ help: injectee, text }, api)
  },
}
