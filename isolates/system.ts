import FS from '@/git/fs.ts'
import { assert, Debug } from '@utils'
import {
  C,
  ENTRY_BRANCH,
  Functions,
  getParent,
  IA,
  isPID,
  jsonSchema,
  md5,
  PID,
  pidSchema,
  print,
  Proctype,
  Returns,
  ToApiType,
} from '@/constants.ts'
import { isBaseRepo } from '@/constants.ts'
import { z } from 'zod'
const log = Debug('AI:system')

const init = z.object({
  repo: z.string(),
  isolate: z.string().optional(),
  params: z.record(jsonSchema).optional(),
})
const headResult = z.object({ head: md5, elapsed: z.number().int().gt(0) })
const pidResult = headResult.extend({
  pid: pidSchema,
})

export const parameters = {
  rm: z.object({ pid: pidSchema }).describe('remove a repository'),
  clone: init.describe('clone a repository'),
  init: init.describe('initialize a repository'),
  pull: z.object({ repo: z.string(), target: pidSchema.optional() }).describe(
    'pull a repository into the current branch, or optionally the given PID',
  ),
  mergeParent: z.object({}).describe(
    'merge this branch into the parent branch',
  ),
  mergeGrandParent: z.object({}).describe(
    'merge the parent branch into the grandparent branch',
  ),
  sideEffectClone: z.object({ repo: z.string() }).describe(
    'clone a repository as a side effect',
  ),
  sideEffectInit: z.object({ repo: z.string() }).describe(
    'initialize a repository as a side effect',
  ),
  sideEffectFetch: z.object({
    target: pidSchema,
    repo: z.string(),
  }).describe('fetch a repository as a side effect'),
}

export const returns: Returns<typeof parameters> = {
  rm: z.void(),
  clone: pidResult,
  init: pidResult,
  pull: headResult,
  mergeParent: headResult,
  mergeGrandParent: headResult,
  sideEffectClone: pidResult,
  sideEffectInit: pidResult,
  sideEffectFetch: headResult,
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  init: async ({ repo, isolate, params }, api) => {
    // TODO lock so only the actor branch can call this function
    const actions = await api.actions<Api>('system')
    const result = await actions.sideEffectInit({ repo })
    if (isolate) {
      await api.action({
        isolate,
        // TODO fire an error if this isolate is not installable
        functionName: '@@install',
        params: params || {},
        proctype: Proctype.enum.SERIAL,
        target: result.pid,
      })
      log('installed', print(result.pid))
    }
    return result
  },
  rm: async ({ pid }, api: IA<C>) => {
    assert(isPID(pid), 'invalid pid')
    assert(isBaseRepo(pid), 'cannot remove a non-base repository')
    log('rm', print(pid))
    const { db } = api.context
    assert(db, 'db not found')
    await db.rm(pid)
  },
  clone: async ({ repo, isolate, params }, api) => {
    log('clone', repo, isolate, params)

    const actions = await api.actions<Api>('system')
    const result = await actions.sideEffectClone({ repo })
    if (isolate) {
      await api.action({
        isolate,
        functionName: '@@install',
        params: params || {},
        proctype: Proctype.enum.SERIAL,
        target: result.pid,
      })
    }
    log('cloned %s in %ims', print(result.pid), result.elapsed)
    return result
  },
  pull: async ({ repo, target }, api: IA<C>) => {
    target = target || api.pid
    log('pull', repo, print(target))
    const actions = await api.actions<Api>('system')
    log('commit before fetch', api.commit)
    const fetchHead = await actions.sideEffectFetch({ target, repo })
    log('commit after fetch', api.commit)
    log('fetched', fetchHead)

    const { db } = api.context
    assert(db, 'db not found')
    const fs = await FS.openHead(target, db)
    const oid = await fs.merge(fetchHead.head)
    if (fetchHead.head === oid) {
      log('no changes')
      return fetchHead
    }

    const atomic = await db.atomic().updateHead(target, fs.oid, oid)
    assert(atomic, 'update head failed')
    if (!await atomic.commit()) {
      // TODO try a bit harder to commit
      throw new Error('failed to commit: ' + repo)
    }
    return fetchHead
  },
  mergeParent: (_, api: IA<C>) => {
    const ours = getParent(api.pid)
    const theirs = api.commit
    return oursMerge(ours, theirs, api)
  },
  mergeGrandParent: async (_, api: IA<C>) => {
    const { db } = api.context
    assert(db, 'db not found')

    const ours = getParent(getParent(api.pid))
    const parentFs = await FS.openHead(getParent(api.pid), db)
    return oursMerge(ours, parentFs.oid, api)
  },
  sideEffectClone: async ({ repo }, api: IA<C>) => {
    // TODO assert we got called by ourselves
    const { db } = api.context
    assert(db, 'db not found')
    const start = Date.now()
    const { pid, oid } = await FS.clone(repo, db)
    const elapsed = Date.now() - start
    return { pid, head: oid, elapsed }
  },
  sideEffectInit: async ({ repo }, api: IA<C>) => {
    // TODO assert we got called by ourselves
    const { db } = api.context
    assert(db, 'db not found')

    const [account, repository] = repo.split('/')
    const partial = { account, repository, branches: [ENTRY_BRANCH] }

    const start = Date.now()
    const { pid, oid } = await FS.init(partial, db)
    return { pid, head: oid, elapsed: Date.now() - start }
  },
  sideEffectFetch: async ({ target, repo }, api: IA<C>) => {
    const { db } = api.context
    assert(db, 'db not found')
    const start = Date.now()
    const head = await FS.fetch(repo, target, db)
    return { head, elapsed: Date.now() - start }
  },
}
const oursMerge = async (ours: PID, theirs: string, api: IA<C>) => {
  const { db } = api.context
  assert(db, 'db not found')
  const start = Date.now()

  const fs = await FS.openHead(ours, db)
  const { next } = await fs.theirsMerge(theirs)

  const atomic = await db.atomic().updateHead(ours, fs.oid, next.oid)
  assert(atomic, 'update head failed')
  if (!await atomic.commit()) {
    // TODO try a bit harder to commit
    throw new Error('failed to commit: ' + print(ours))
  }
  return { head: next.oid, elapsed: Date.now() - start }
}
