import { IsolateApi } from '@/artifact/constants.ts'
import { Debug } from '@utils'
const log = Debug('AI:session')
export const api = {
  create: {
    description: 'Creat a new session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  end: {
    description: 'End a session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export const functions = {
  create: async (_: object, api: IsolateApi) => {
    // spawn something off ?
    log(api)
  },
  end: async (_: object, api: IsolateApi) => {
    log(api)
  },
}
