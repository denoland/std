import {
  actorIdRegex,
  addBranches,
  Functions,
  getRoot,
  PID,
  toApi,
  ToApiType,
} from '@/constants.ts'
import FS from '@/git/fs.ts'
import { assert, Debug } from '@utils'
import { z } from 'zod'

export const parameters = {
  upsert: z.object({
    machineId: z.string(),
    actorId: z.string(),
  }),
}
export const returns = {
  upsert: z.void(),
}

export const api = toApi(parameters)

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  upsert({ machineId, actorId }, api) {
    const path = shardedPath(MACHINES, 'mac_', machineId)
    api.writeJSON(path, actorId)
  },
}
const MACHINES = '.machines/'

const shardedPath = (folder: string, prefix: string, id: string) => {
  assert(folder.endsWith('/'), 'folder must end with /: ' + folder)
  const shard = folder + id.slice(0, prefix.length + 2)
  const suffix = id.slice(prefix.length + 2)
  const path = shard + '/' + suffix + '.json'
  return path
}

export const tryActorId = async (machineId: string, fs: FS) => {
  const machinePath = shardedPath(MACHINES, 'mac_', machineId)
  if (await fs.exists(machinePath)) {
    const actorId = await fs.readJSON<string>(machinePath)
    assert(actorIdRegex.test(actorId), 'invalid actor: ' + actorId)
    return actorId
  }
}

export const getMachineTarget = (pid: PID) => {
  const base = getRoot(pid)
  return addBranches(base, 'machines')
}
