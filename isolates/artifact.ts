import { Debug, fromOutcome } from '@utils'
import Executor from '../exe/exe.ts'
import git from '$git'
import http from '$git/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import {
  ENTRY_BRANCH,
  IsolateFunctions,
  IsolateLifecycle,
  Params,
  PID,
} from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import IO from '@io/io.ts'
import DB from '../db.ts'
import FS from '../fs.ts'
import Cradle from '@/cradle.ts'
import { assert } from 'https://deno.land/std@0.203.0/assert/assert.ts'
import { pidFromRepo } from '@/keys.ts'
import { SolidRequest } from '@/constants.ts'
import { Poolable } from '@/constants.ts'
import { PierceRequest } from '@/constants.ts'
import { isPierceRequest } from '@/constants.ts'

const log = Debug('AI:artifact')
const repo = {
  type: 'object',
  required: ['repo'],
  properties: {
    repo: {
      type: 'string',
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_]*\/[a-zA-Z0-9][a-zA-Z0-9-_]*$',
    },
  },
}
const pid = {
  type: 'object',
  required: ['account', 'repository', 'branches'],
  additionalProperties: false,
  properties: {
    account: {
      type: 'string',
    },
    repository: {
      type: 'string',
    },
    branches: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    },
  },
}
const request = {
  type: 'object',
  required: ['isolate'],
  properties: {
    isolate: {
      type: 'string',
    },
    pid,
  },
}

export const api = {
  ping: {
    type: 'object',
    description: 'Check queue processing system is alive',
    properties: {},
  },
  probe: repo,
  init: repo,
  clone: repo,
  pull: repo,
  push: repo,
  rm: repo,
  apiSchema: {
    type: 'object',
    required: ['isolate'],
    properties: {
      isolate: {
        type: 'string',
      },
    },
  },
  pierce: request,
  request: {
    type: 'object',
    required: ['request'],
    properties: {
      request,
      prior: { type: 'number' },
    },
  },
  branch: {
    type: 'object',
    required: ['branch', 'commit'],
    properties: {
      branch: pid,
      commit: { type: 'string' },
    },
  },
  logs: repo,
  // subscribe to json by filepath and pid
  // subscribe to path in json, so we can subscribe to the output of io.json
  // subscribe to binary by filepath and pid - done by commit watching

  // requesting a patch would be done with the last known patch as cursor
}

export type C = { db: DB; io: IO; fs: FS; exe: Executor; self: Cradle }

export const functions: IsolateFunctions = {
  ping: (params?: Params) => {
    log('ping', params)
    return params
  },
  async probe(params, api: IsolateApi<C>) {
    const pid = pidFromRepo(params.repo as string)
    const head = await api.context.db!.getHead(pid)
    if (head) {
      return { pid, head }
    }
  },
  // need to split the git functions out to be an isolate
  async init(params, api: IsolateApi<C>) {
    const start = Date.now()
    const pid = pidFromRepo(params.repo as string)
    const probe = await functions.probe(params, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    const { fs } = memfs()
    const dir = '/'
    await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })

    const lockId = await api.context.db!.getHeadlock(pid)
    const head = 'INIT'
    const result = await api.context.fs!.update(pid, fs, head, lockId)
    await api.context.db!.releaseHeadlock(pid, lockId)
    log('snapshot size:', result.prettySize)
    return { pid, head, size: result.prettySize, elapsed: Date.now() - start }
  },
  async clone(params, api: IsolateApi<C>) {
    const start = Date.now()
    const pid = pidFromRepo(params.repo as string)
    const probe = await functions.probe(params, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    // TODO use the fs option in the context, by loading an asserted blank fs

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${pid.account}/${pid.repository}.git`
    log('cloning %s', url)
    // TODO make an index file without doing a full checkout
    // https://github.com/dreamcatcher-tech/artifact/issues/28
    await git.clone({ fs, http, dir, url })
    const [{ oid: head }] = await git.log({ fs, dir, depth: 1 })
    log('cloned', head)
    const lockId = await api.context.db!.getHeadlock(pid)
    const result = await api.context.fs!.update(pid, fs, head, lockId)
    await api.context.db!.releaseHeadlock(pid, lockId)

    log('snapshot size:', result.prettySize)
    return { pid, head, size: result.prettySize, elapsed: Date.now() - start }
  },
  pull() {
    throw new Error('not implemented')
  },
  push() {
    throw new Error('not implemented')
  },
  rm(params, api: IsolateApi<C>) {
    // TODO lock the whole repo in case something is running
    const pid = pidFromRepo(params.repo as string)
    return Promise.all([api.context.fs!.rm(pid), api.context.db!.rm(pid)])
  },
  apiSchema: async (params: Params) => {
    // when it loads from files, will benefit from being close to the db
    const isolate = params.isolate as string
    const compartment = await Compartment.create(isolate)
    return compartment.api
  },
  pierce: async (params, api: IsolateApi<C>) => {
    log('pierce %o %o', params.isolate, params.functionName)
    const request = params as PierceRequest
    assert(isPierceRequest(request), 'invalid pierce request')
    await api.context.io!.induct(request)
    const { outcome } = await api.context.db!.watchReply(request)
    return fromOutcome(outcome)
  },
  request: async (params, api: IsolateApi<C>) => {
    const commit = params.commit as string
    const request = params.request as SolidRequest
    const pid = request.target
    const fs = await api.context.fs!.load(pid)
    const induct = (poolable: Poolable) => api.context.io!.induct(poolable)
    const exe = api.context.exe!
    const _done = await exe.execute(pid, commit, request, fs, induct)

    // TODO if execution finished, then call the next request action
    // if there isn't one, then commit will handle the restarting
  },
  branch: async (params: Params, api: IsolateApi<C>) => {
    const { branch, commit } = params as Branch
    await api.context.io!.branch(branch, commit)
  },
  logs: async (params, api: IsolateApi<C>) => {
    log('logs')
    const pid = pidFromRepo(params.repo as string)
    const fs = await api.context.fs!.load(pid)
    const logs = await git.log({ fs, dir: '/' })
    return logs
  },
}

type Branch = { branch: PID; commit: string }

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    assert(api.context.self, 'self not found')
    const db = await DB.create()
    const io = IO.create(db, api.context.self)
    const fs = FS.create(db)
    const exe = Executor.create()
    // in testing, alter the context to support ducking the queue
    api.context = { db, io, fs, exe }
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}
