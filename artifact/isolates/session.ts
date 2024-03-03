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

// TODO make an isolate that can take in the options as params
export const functions = {
  create: (_: object, api: IsolateApi) => {
    // spawn something off ?
    log(api)
    // the session chain just got told to spawn off a new session chain
  },
  end: (_: object, api: IsolateApi) => {
    log(api)
  },
}
