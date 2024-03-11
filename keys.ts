import { ENTRY_BRANCH, PID, Poolable, Reply, Request } from '@/constants.ts'
import { assert } from '@utils'
import { ulid } from 'https://deno.land/std@0.216.0/ulid/mod.ts'

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
  assert(poolable.target, 'target is required')
  const id = getId(poolable)
  return [...getPoolKeyPrefix(poolable.target), id]
}
export const getReplyKey = (pid: PID, action: Request | Reply) => {
  const { account, repository, branches } = pid
  const id = getId(action)
  return [KEYSPACES.REPLIES, account, repository, ...branches, id]
}
export const getHeadLockKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.HEADLOCK, account, repository, ...branches]
}
export const getHeadKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.HEAD, account, repository, ...branches]
}
export const getRepoKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.REPO, account, repository, ...branches]
}
export const getBlobKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.BLOB, account, repository, ...branches, 'blob-' + ulid()]
}
export const getPrefixes = (pid: PID) => {
  const { account, repository } = pid
  const prefixes = []
  for (const keyspace of Object.values(KEYSPACES)) {
    prefixes.push([keyspace, account, repository])
  }
  return prefixes
}
enum KEYSPACES {
  POOL = 'POOL', // all pending requests and replies trying to be committed
  REPLIES = 'REPLIES', // for watching replies
  HEADLOCK = 'HEADLOCK', // the lock on the head of a given process branch
  REPO = 'REPO', // this is the latest fs snapshot of a given process branch
  BLOB = 'BLOB', // where the contents of repo snapshots are stored
  HEAD = 'HEAD', // the tip commit hash of a given process branch
}

const getId = (action: Request | Reply) => {
  if ('ulid' in action) {
    return action.ulid
  } else {
    assert('sequence' in action, 'sequence is required')
    return action.sequence
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
