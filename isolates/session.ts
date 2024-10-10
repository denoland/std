import { ToApiType } from '@/constants.ts'
import { pidSchema } from '@/constants.ts'
import { Functions, print, ProcessOptions } from '@/constants.ts'
import { assert, Debug } from '@utils'
import { z } from 'zod'
const log = Debug('AI:session')

export const parameters = {
  create: z.object({
    name: z.string().optional(),
    prefix: z.string().optional(),
  }).refine((v) => Object.keys(v).length <= 1)
    .describe('Creat a new session branch'),
  noop: z.object({}).describe(
    'a noop that is used to start a long running branch',
  ),
}
export const returns = {
  create: pidSchema,
  noop: pidSchema,
}

export type Api = ToApiType<typeof parameters, typeof returns>

// TODO try kill this whole file

export const functions: Functions<Api> = {
  async create({ name, prefix }, api) {
    log('create %o', { name, prefix })

    const options: ProcessOptions = { noClose: true }
    if (prefix) {
      options.prefix = prefix
    }
    if (name) {
      options.branchName = name
    }
    const { noop } = await api.actions<Api>('session', options)
    const pid = await noop({})
    assert(pid, 'no pid returned')
    log('noop pid returned', print(pid))
    return pid
  },
  noop(_: object, api) {
    log('noop', print(api.pid))
    return api.pid
  },
}
