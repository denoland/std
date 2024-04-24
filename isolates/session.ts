import { IsolateApi, PID, print } from '@/constants.ts'
import { Debug } from '@utils'
const log = Debug('AI:session')
export const api = {
  create: {
    description: 'Creat a new session branch',
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  noop: {
    description: 'a noop that is used to start a long running branch',
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

export type Api = {
  create: (arg1?: { prefix?: string }) => Promise<PID>
  close: () => void
}

// TODO make an isolate that can take in the options as params
export const functions = {
  async create({ retry }: { retry?: PID } = {}, api: IsolateApi) {
    log('create', retry && print(retry))
    if (retry) {
      // how to validate a pid ?
      // every chain should have access to its children
    }

    const { noop } = await api.actions('session')
    const pid = await noop({}, { noClose: true, prefix: 'session' })
    log('noop pid', pid)
    return pid
  },
  noop(_: object, api: IsolateApi) {
    log('noop', api.pid)
    return api.pid
  },
  close: (_: object, api: IsolateApi) => {
    log(api)
    // message the parent and tell it to close this child
  },
}
