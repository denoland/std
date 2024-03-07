import { IsolateApi } from '@/constants.ts'
import { Debug } from '@utils'
const log = Debug('AI:session')
export const api = {
  create: {
    description: 'Creat a new session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  close: {
    description: 'End a session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

// TODO make an isolate that can take in the options as params
export const functions = {
  create: (_: object, api: IsolateApi) => {
    // TODO this needs to be called inside an isolate
    // then it can control custom branch names
    log('new session created')
    return api.pid
  },
  close: (_: object, api: IsolateApi) => {
    log(api)
    // message the parent and tell it to close this child
  },
}
