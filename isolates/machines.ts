import { IsolateApi } from '@/constants.ts'

export type Api = {
  upsert: (params: { machineId: string; actorId: string }) => Promise<void>
}
export const api = {
  upsert: {
    type: 'object',
    required: ['machineId', 'actorId'],
    properties: {
      machineId: { type: 'string' },
      actorId: { type: 'string' },
    },
    additionalProperties: false,
  },
}
export const functions = {
  upsert(p: { machineId: string; actorId: string }, api: IsolateApi) {
    const { machineId, actorId } = p
    const path = shardedPath(machineId)
    api.writeJSON(path, actorId)
  },
}

// TODO move this to take an api object and retrive the actorId
export const shardedPath = (machineId: string) => {
  const prefix = machineId.slice(0, 2)
  const suffix = machineId.slice(2)
  return prefix + '/' + suffix + '.json'
}
