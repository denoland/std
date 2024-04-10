import { isPierceRequest } from '@/constants.ts'
import { isRequest } from '@/constants.ts'
import { ENTRY_BRANCH, PID, Poolable, Reply, Request } from '@/constants.ts'
import { assert } from '@utils'

const assertPid = (pid: PID) => {
  assert(pid.id, 'id is required')
  assert(pid.account, 'account is required')
  assert(pid.repository, 'repository is required')
  assert(pid.branches[0], 'branch is required')
  const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
}
export const getPoolKeyPrefix = (pid: PID) => {
  const { id, account, repository, branches } = pid
  return [id, account, repository, 'pool', ...branches]
}
export const getPoolKey = (poolable: Poolable) => {
  const uid = getId(poolable)
  return [...getPoolKeyPrefix(poolable.target), uid]
}
export const getRepoKey = (pid: PID) => {
  const { id, account, repository, branches } = pid
  return [id, account, repository, ...branches]
}
export const getRepoBase = (pid: PID) => {
  const { id, account, repository } = pid
  return [id, account, repository]
}
const getId = (action: Request | Reply) => {
  const id = (pid: PID, sequence: number) => {
    return `${pid.account}/${pid.repository}:${
      pid.branches.join('/')
    }:${sequence}`
  }
  if (isRequest(action)) {
    if (isPierceRequest(action)) {
      return action.ulid
    }
    return id(action.source, action.sequence)
  } else {
    return id(action.target, action.sequence)
  }
}

export const pidFromRepo = (id: string, repo: string): PID => {
  const [account, repository] = repo.split('/')
  const pid: PID = {
    id,
    account,
    repository,
    branches: [ENTRY_BRANCH],
  }
  assertPid(pid)
  Object.freeze(pid)
  Object.freeze(pid.branches)
  return pid
}
export const getHeadKey = (pid: PID) => {
  const prefix = getRepoBase(pid)
  return [...prefix, 'refs', 'heads', ...pid.branches]
}
export const getEffectsLockKey = (pid: PID) => {
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

export const UNDELIVERED = ['__system', 'system', 'system', 'undelivered']
