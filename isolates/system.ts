import FS from '@/git/fs.ts'
import { assert, Debug } from '@utils'
import {
  C,
  ENTRY_BRANCH,
  IsolateApi,
  isPID,
  Params,
  PID,
  pidSchema,
  print,
  PROCTYPE,
} from '@/constants.ts'
import { isBaseRepo } from '@/constants.ts'
const log = Debug('AI:system')

export const api = {
  rm: {
    description: 'remove a repository',
    type: 'object',
    required: ['pid'],
    additionalProperties: false,
    properties: { pid: pidSchema },
  },
  clone: {
    description: 'clone a repository',
    type: 'object',
    required: ['repo'],
    additionalProperties: false,
    properties: {
      repo: { type: 'string' },
      isolate: { type: 'string' },
      params: { type: 'object' },
    },
  },
  init: {
    description: 'initialize a repository',
    type: 'object',
    required: ['repo'],
    additionalProperties: false,
    properties: {
      repo: { type: 'string' },
      isolate: { type: 'string' },
      params: { type: 'object' },
    },
  },
}

export type Api = {
  init: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string }>
  clone: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
  rm: (params: { pid: PID }) => Promise<boolean>
}
export const functions = {
  init: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IsolateApi<C>,
  ) => {
    const { repo, isolate, params = {} } = p
    const [account, repository] = repo.split('/')
    // TODO lock so only the actor branch can call this function

    const { db } = api.context
    assert(db, 'db not found')
    const partial = { account, repository, branches: [ENTRY_BRANCH] }
    const { pid } = await FS.init(partial, db)
    if (isolate) {
      await api.action({
        isolate,
        // TODO fire an error if this isolate is not installable
        functionName: '@@install',
        params,
        proctype: PROCTYPE.SERIAL,
        target: pid,
      })
      log('installed', print(pid))
    }
    const { oid } = await FS.openHead(pid, db)
    return { pid, head: oid }
  },
  rm: (params: { pid: PID }, api: IsolateApi<C>) => {
    const { pid } = params
    assert(isPID(pid), 'invalid pid')
    assert(isBaseRepo(pid), 'cannot remove a non-base repository')
    log('rm', print(pid))
    const { db } = api.context
    assert(db, 'db not found')
    return db.rm(pid)
  },
  clone: async (
    p: { repo: string; isolate?: string; params: Params },
    api: IsolateApi<C>,
  ) => {
    const { repo, isolate, params = {} } = p
    log('clone', repo, isolate, params)
    const { db } = api.context
    assert(db, 'db not found')

    const start = Date.now()
    const { pid } = await FS.clone(repo, db)
    if (isolate) {
      await api.action({
        isolate,
        functionName: '@@install',
        params,
        proctype: PROCTYPE.SERIAL,
        target: pid,
      })
    }
    log('cloned', print(pid))
    const { oid } = await FS.openHead(pid, db)
    return { pid, head: oid, elapsed: Date.now() - start }
  },
}
