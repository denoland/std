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
}
export type Api = {
  upsert: (params: { machineId: string; actorId: string }) => void
  /** Register an agentHash to an OpenAI assistant id */
  register: (params: { agentHash: string; assistantId: string }) => void
}
export const functions: Functions<Api> = {
  upsert({ machineId, actorId }, api) {
    const path = shardedPath('machines', machineId)
    api.writeJSON(path, actorId)
  },
  register({ agentHash, assistantId }, api) {
    assert(agentHashRegex.test(agentHash), 'invalid agent hash: ' + agentHash)
    assert(assistantId.startsWith('asst_'), 'invalid assistant: ' + assistantId)
    const path = shardedPath('agents', agentHash)
    api.writeJSON(path, assistantId)
  },
}

const shardedPath = (folder: string, id: string) => {
  const prefix = folder + '/' + id.slice(0, 2)
  const suffix = id.slice(2)
  return prefix + '/' + suffix + '.json'
}

export const tryActorId = async (machineId: string, fs: FS) => {
  console.log('machineId', machineId, 'THIS SHOULD BE RANDOM 2 CHARS')
  const machinePath = shardedPath('machines', machineId)
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
  const path = shardedPath('agents', agentHash)
  const target = getMachineTarget(api.pid)
  // TODO make the api do this without an action
  const { read } = await api.actions<files.Api>('files', { target })
  try {
    const string = await read({ path })
    const assistantId = JSON.parse(string)
    assert(assistantId.startsWith('asst_'), 'invalid assistant: ' + assistantId)
    return assistantId
  } catch (error) {
    log('no assistant found for agentHash', agentHash, error.message)
  }
}
