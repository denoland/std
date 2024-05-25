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
  sideEffectClone: {
    description: 'clone a repository as a side effect',
    type: 'object',
    required: ['repo'],
    additionalProperties: false,
    properties: { repo: { type: 'string' } },
  },
  sideEffectInit: {
    description: 'initialize a repository as a side effect',
    type: 'object',
    required: ['repo'],
    additionalProperties: false,
    properties: { repo: { type: 'string' } },
  },
}

export type Api = {
  init: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string }>
  clone: (
    params: { repo: string; isolate?: string; params?: Params },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
  rm: (params: { pid: PID }) => Promise<void>
  sideEffectClone: (
    params: { repo: string },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
  sideEffectInit: (
    params: { repo: string },
  ) => Promise<{ pid: PID; head: string }>
}
export const functions = {
  init: async (
    p: { repo: string; isolate?: string; params?: Params },
    api: IsolateApi<C>,
  ) => {
    const { repo, isolate, params = {} } = p
    // TODO lock so only the actor branch can call this function

    const actions = await api.actions<Api>('system')
    const { pid, head } = await actions.sideEffectInit({ repo })
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
    return { pid, head }
  },
  rm: async (params: { pid: PID }, api: IsolateApi<C>) => {
    const { pid } = params
    assert(isPID(pid), 'invalid pid')
    assert(isBaseRepo(pid), 'cannot remove a non-base repository')
    log('rm', print(pid))
    const { db } = api.context
    assert(db, 'db not found')
    await db.rm(pid)
  },
  clone: async (
    p: { repo: string; isolate?: string; params: Params },
    api: IsolateApi<C>,
  ) => {
    const { repo, isolate, params = {} } = p
    log('clone', repo, isolate, params)

    const actions = await api.actions<Api>('system')
    const { pid, head, elapsed } = await actions.sideEffectClone({ repo })
    if (isolate) {
      await api.action({
        isolate,
        functionName: '@@install',
        params,
        proctype: PROCTYPE.SERIAL,
        target: pid,
      })
    }
    log('cloned %s in %ims', print(pid), elapsed)
    return { pid, head, elapsed }
  },
  sideEffectClone: async ({ repo }: { repo: string }, api: IsolateApi<C>) => {
    // TODO assert we got called by ourselves
    const { db } = api.context
    assert(db, 'db not found')
    const start = Date.now()
    const { pid, oid } = await FS.clone(repo, db)
    const elapsed = Date.now() - start
    return { pid, head: oid, elapsed }
  },
  sideEffectInit: async ({ repo }: { repo: string }, api: IsolateApi<C>) => {
    // TODO assert we got called by ourselves
    const { db } = api.context
    assert(db, 'db not found')

    const [account, repository] = repo.split('/')
    const partial = { account, repository, branches: [ENTRY_BRANCH] }

    const { pid, oid } = await FS.init(partial, db)
    return { pid, head: oid }
  },
}
