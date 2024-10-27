import {
  addBranches,
  Functions,
  getActorPid,
  getBaseName,
  type IA,
  print,
  ToApiType,
} from '@/constants.ts'
import { Debug } from '@utils'
import * as session from '@/isolates/session.ts'
import { z } from 'zod'

const log = Debug('AI:test-registry')

// TODO move to zodObject for all objects
export const parameters = {
  '@@install': z.object({}).describe('Ensures the basic branch structure'),
  createController: z.object({})
    .describe(
      'Creates a controller in a branch and returns the controllerId',
    ),
  deleteController: z.object({
    controllerId: z.string().describe('The controllerId to delete'),
  }).describe('Deletes the controller and its containing branch'),
}
export const returns = {
  '@@install': z.void(),
  createController: z.string(),
  deleteController: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  '@@install': (_, api) => {
    log('installing', print(api.pid))
  },
  createController: async (_, api) => {
    console.log('creating controller')
    const target = await ensureRegistry(api)
    const { noop } = await api.actions<session.Api>('session', {
      target,
      noClose: true,
      prefix: 'ctrl',
    })
    const pid = await noop({})
    log('created controller', print(pid))

    return getBaseName(pid)
  },
  deleteController: ({ controllerId }, api) => {
    console.log('deleting controller', controllerId, print(api.pid))
  },
}

const ensureRegistry = async (api: IA) => {
  const actor = getActorPid(api.pid)
  const registry = addBranches(actor, 'tests')
  if (!await api.isPidExists(registry)) {
    const actions = await api.actions<Api>('test-registry', {
      target: actor,
      branchName: 'tests',
      noClose: true,
    })
    await actions['@@install']({})
  }
  return registry
}
