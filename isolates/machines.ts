import {
  actorIdRegex,
  addBranches,
  agentHashRegex,
  Functions,
  getBase,
  IA,
  PID,
} from '@/constants.ts'
import FS from '@/git/fs.ts'
import { assert, Debug } from '@utils'
import * as files from '@/isolates/files.ts'

const log = Debug('AI:machines')

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
  register: {
    type: 'object',
    required: ['agentHash', 'assistantId'],
    properties: {
      agentHash: { type: 'string', pattern: agentHashRegex.source },
      assistantId: { type: 'string', pattern: /^asst_/.source },
    },
    additionalProperties: false,
  },
  deleteAllAgents: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}
export type Api = {
  upsert: (params: { machineId: string; actorId: string }) => void
  /** Register an agentHash to an OpenAI assistant id */
  register: (params: { agentHash: string; assistantId: string }) => void
  deleteAllAgents: (params: void) => Promise<string[]>
}
export const functions: Functions<Api> = {
  upsert({ machineId, actorId }, api) {
    const path = shardedPath(MACHINES, 'mac_', machineId)
    api.writeJSON(path, actorId)
  },
  register({ agentHash, assistantId }, api) {
    assert(agentHashRegex.test(agentHash), 'invalid agent hash: ' + agentHash)
    assert(assistantId.startsWith('asst_'), 'invalid assistant: ' + assistantId)
    const path = shardedPath(ASSISTANTS, 'age_', agentHash)
    api.writeJSON(path, assistantId)
  },
  deleteAllAgents: async (_, api) => {
    const agents = await api.ls(ASSISTANTS)
    const ids = []
    for (const shard of agents) {
      const agents = await api.ls(`${ASSISTANTS}${shard}`)
      for (const agent of agents) {
        const path = `${ASSISTANTS}${shard}${agent}`
        const id = await api.readJSON<string>(path)
        ids.push(id)
        api.delete(path)
      }
    }
    return ids
  },
}
const ASSISTANTS = '.assistants/'
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
  const base = getBase(pid)
  return addBranches(base, 'machines')
}

export const tryAssistantId = async (agentHash: string, api: IA) => {
  assert(agentHashRegex.test(agentHash), 'invalid agent hash: ' + agentHash)
  const path = shardedPath(ASSISTANTS, 'age_', agentHash)
  const target = getMachineTarget(api.pid)
  // TODO make the api do this without an action
  const { read } = await api.actions<files.Api>('files', { target })
  try {
    const string = await read({ path })
    const assistantId = JSON.parse(string)
    assert(assistantId.startsWith('asst_'), 'invalid assistant: ' + assistantId)
    return assistantId
  } catch (error) {
    if (error.code === 'NotFoundError') {
      log('no assistant found for agentHash', agentHash)
      return
    }
    throw error
  }
}
