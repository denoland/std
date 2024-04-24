import { IsolateApi, PID, print } from '@/constants.ts'
import { Debug } from '@utils'
const log = Debug('AI:session')
export const api = {
  create: {
    description: 'Creat a new session branch',
    type: 'object',
    additionalProperties: false,
    properties: {
      retry: {
        type: 'object',
        description:
          'If we have a stored session id, attempt to validate it and resume the existing session, else create a new one',
        // TODO use the PID json schema here
      },
    },
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

export const functions = {
  async create({ retry }: { retry?: PID } = {}, api: IsolateApi) {
    log('create', retry && print(retry))
    if (retry) {
      if (await api.pidExists(retry)) {
        // TODO check signing keys for validity too
        return retry
      }
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
