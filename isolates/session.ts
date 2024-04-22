import { IsolateApi, PID, ProcessOptions } from '@/constants.ts'
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
  create: () => Promise<PID>
  noop: (_?: object, opts?: ProcessOptions) => Promise<PID>
  close: () => void
}

// TODO make an isolate that can take in the options as params
export const functions = {
  async create(_: object, api: IsolateApi) {
    // TODO this needs to be called inside an isolate
    // then it can control custom branch names
    log('create new session created')

    const { noop } = await api.actions<Api>('session')
    const pid = await noop({}, { noClose: true })
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
