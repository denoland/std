import { actorIdRegex, IsolateApi } from '@/constants.ts'
import FS from '@/git/fs.ts'
import { assert } from '@utils'

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

const shardedPath = (machineId: string) => {
  const prefix = machineId.slice(0, 2)
  const suffix = machineId.slice(2)
  return prefix + '/' + suffix + '.json'
}

export const tryActorId = async (machineId: string, fs: FS) => {
  const machinePath = shardedPath(machineId)
  if (await fs.exists(machinePath)) {
    const actorId = await fs.readJSON<string>(machinePath)
    assert(actorIdRegex.test(actorId), 'invalid actor: ' + actorId)
    return actorId
  }
}
