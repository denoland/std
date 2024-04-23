import {
  isMergeReply,
  isPierceRequest,
  PID,
  Poolable,
  SolidRequest,
} from '@/constants.ts'
import { assert } from '@utils'
/** The current count of everything that has been atomically pooled */
export const POOL_COUNTER = 'counter'
/** What value the pool has been processed up to */
export const POOL_MARKER = 'marker'
export const getPoolKeyPrefix = (pid: PID) => {
  const { id, account, repository, branches } = pid
  return [id, account, repository, 'pool', ...branches]
}
export const getPoolMarkerKey = (pid: PID) => {
  return [...getPoolKeyPrefix(pid), POOL_MARKER]
}
export const getPoolCounterKey = (pid: PID) => {
  return [...getPoolKeyPrefix(pid), POOL_COUNTER]
}
export const getPoolKey = (poolable: Poolable) => {
  const uniqueId = getId(poolable)
  return [...getPoolKeyPrefix(poolable.target), uniqueId]
}
export const getRepoKey = (pid: PID) => {
  const { id, account, repository, branches } = pid
  return [id, account, repository, ...branches]
}
export const getRepoBase = (pid: PID) => {
  const { id, account, repository } = pid
  return [id, account, repository]
}
export const getExeId = (request: SolidRequest) => {
  return idWithSequence(request.source, request.sequence)
}
const idWithSequence = (pid: PID, sequence: number) => {
  return getPoolKeyPrefix(pid).join('/') + ':' + sequence
}
const getId = (poolable: Poolable) => {
  if (!isMergeReply(poolable)) {
    if (isPierceRequest(poolable)) {
      return poolable.ulid
    }
    return idWithSequence(poolable.source, poolable.sequence)
  } else {
    return idWithSequence(poolable.target, poolable.sequence)
  }
}

export const getHeadKey = (pid: PID) => {
  const prefix = getRepoBase(pid)
  return [...prefix, 'refs', 'heads', ...pid.branches]
}
export const getEffectsLockKey = (pid: PID) => {
  // TODO check if a branch is named with something.lock
  const prefix = getRepoBase(pid)
  const branches = [...pid.branches]
  const last = branches.pop()
  return [...prefix, 'refs', 'heads', ...branches, last + '.lock']
}
export const getRepoLockKey = (pid: PID) => {
  const prefix = getRepoBase(pid)
  return [...prefix, 'index.lock']
}
export const headKeyToPid = (headKey: string[]) => {
  const [id, account, repository, refs, heads, ...branches] = headKey
  assert(id, 'no id')
  assert(refs === 'refs', 'not a refs path')
  assert(heads === 'heads', 'not a heads path')
  assert(branches.length > 0, 'no branches')
  return { id, account, repository, branches }
}

export const UNDELIVERED = ['0', 'system', 'system', 'undelivered']
