import { Debug, fromOutcome } from '@utils'
import Executor from '../exe/exe.ts'
import { init } from '../git/mod.ts'
import http from 'npm:isomorphic-git/http/web/index.js'
import { memfs } from '$memfs'
import git from '$git'
import {
  IsolateFunctions,
  IsolateLifecycle,
  isPID,
  isPierceRequest,
  Params,
  PID,
  PierceRequest,
  SolidRequest,
} from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import IO from '@io/io.ts'
import DB from '../db.ts'
import FS from '../fs.ts'
import Cradle from '@/cradle.ts'
import { assert } from 'https://deno.land/std@0.203.0/assert/assert.ts'
import { pidFromRepo } from '@/keys.ts'

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
    let pid: PID
    if (typeof params.repo !== 'string') {
      assert(isPID(params.pid), 'must provide pid if no repo')
      pid = params.pid
    } else {
      pid = pidFromRepo(params.repo as string)
    }
    const head = await api.context.db!.getHead(pid)
    if (head) {
      return { pid, head }
    }
  },
  // need to split the git functions out to be an isolate
  async init(params, api: IsolateApi<C>) {
    const start = Date.now()
    assert(typeof params.repo === 'string', 'repo must be a string')
    const probe = await functions.probe(params, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    const { fs } = memfs()
    const { pid, commit: head } = await init(fs, params.repo)

    const lockId = await api.context.db!.getHeadlock(pid)
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
    // BUT if the files were cached on cloudflare should stay near the user
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
    const exe = api.context.exe!
    const { settled, pending } = await exe.execute(pid, commit, request, fs)

    if (settled) {
      const { upserts, deletes, reply } = settled
      if (!upserts.length && !deletes.length) {
        await api.context.io!.induct(reply)
      } else {
        await api.context.io!.inductFiles(reply, upserts, deletes, fs)
      }
    } else {
      assert(pending, 'if not settled, must be pending')
      await Promise.all(
        pending.requests.map((request) => api.context.io!.induct(request)),
      )
    }
  },
  branch: async (params: Params, api: IsolateApi<C>) => {
    const { branch, commit } = params as Branch
    await api.context.io!.branch(branch, commit)
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
