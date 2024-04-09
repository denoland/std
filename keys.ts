import { isPierceRequest } from '@/constants.ts'
import { isRequest } from '@/constants.ts'
import { ENTRY_BRANCH, PID, Poolable, Reply, Request } from '@/constants.ts'
import { assert } from '@utils'

const assertPid = (pid: PID) => {
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
  const { account, repository, branches } = pid
  return [KEYSPACES.POOL, account, repository, ...branches]
}
export const getPoolKey = (poolable: Poolable) => {
  const id = getId(poolable)
  return [...getPoolKeyPrefix(poolable.target), id]
}
export const getRepoKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.REPO, account, repository, ...branches]
}
export const getPrefixes = (pid: PID) => {
  const { account, repository } = pid
  const prefixes = []
  for (const keyspace of Object.values(KEYSPACES)) {
    prefixes.push([keyspace, account, repository])
  }
  return prefixes
}
export const getRepoRoot = (pid: PID) => {
  const { account, repository } = pid
  return [KEYSPACES.REPO, account, repository]
}
export enum KEYSPACES {
  POOL = 'POOL', // all pending requests and replies trying to be committed
  REPO = 'REPO', // the .git folder of a particular repo
  UNDELIVERED = 'UNDELIVERED', // all undelivered queue messages
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

export const pidFromRepo = (repo: string): PID => {
  const [account, repository] = repo.split('/')
  const pid: PID = {
    account,
    repository,
    branches: [ENTRY_BRANCH],
  }
  assertPid(pid)
  return pid
}
export const getHeadKey = (pid: PID) => {
  const prefix = getRepoRoot(pid)
  return [...prefix, 'refs', 'heads', ...pid.branches]
}
export const getHeadLockKey = (pid: PID) => {
  const prefix = getRepoRoot(pid)
  const branches = [...pid.branches]
  const last = branches.pop()
  return [...prefix, 'refs', 'heads', ...branches, last + '.lock']
}
export const getRepoLockKey = (pid: PID) => {
  const prefix = getRepoRoot(pid)
  return [...prefix, 'index.lock']
}
export const headKeyToPid = (headKey: string[]) => {
  const [repo, account, repository, refs, heads, ...branches] = headKey
  assert(repo === KEYSPACES.REPO, 'not a repo path')
  assert(refs === 'refs', 'not a refs path')
  assert(heads === 'heads', 'not a heads path')
  return { account, repository, branches }
}
