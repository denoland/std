import { Debug, fromOutcome } from '@utils'
import Executor from '../exe/exe.ts'
import * as keys from '@/keys.ts'
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
import FS from '../git/fs.ts'
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
  probe: {
    type: 'object',
    description: 'Check if a repo or PID exists',
    additionalProperties: false,
    properties: {
      repo: repo.properties.repo,
      pid: pid,
    },
  },
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
    required: ['pid', 'sequence', 'commit'],
    properties: {
      pid,
      sequence: { type: 'integer', minimum: 0 },
      commit: { type: 'string', pattern: '^[0-9a-f]{40}$' },
    },
  },
  // subscribe to json by filepath and pid
  // subscribe to path in json, so we can subscribe to the output of io.json
  // subscribe to binary by filepath and pid - done by commit watching

  // requesting a patch would be done with the last known patch as cursor
}

export type C = { db: DB; io: IO; exe: Executor; self: Cradle }

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
    assert(api.context.db, 'db not found')
    const fs = await FS.init(params.repo, api.context.db)
    const { pid, commit: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  },
  async clone(params, api: IsolateApi<C>) {
    const start = Date.now()
    const { repo } = params as { repo: string }
    const probe = await functions.probe({ repo }, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    log('cloning %s', repo)
    assert(api.context.db, 'db not found')
    const fs = await FS.clone(repo, api.context.db)
    const { pid, commit: head } = fs
    log('cloned', head)
    return { pid, head, elapsed: Date.now() - start }
  },
  pull() {
    throw new Error('not implemented')
  },
  push() {
    throw new Error('not implemented')
  },
  async rm(params, api: IsolateApi<C>) {
    // TODO lock the whole repo in case something is running
    const pid = pidFromRepo(params.repo as string)
    // TODO maybe have a top level key indicating if the repo is active or not
    // which can get included in the atomic checks for all activities
    const db = api.context.db
    assert(db, 'db not found')
    const prefixes = keys.getPrefixes(pid)
    const promises = []
    for (const prefix of prefixes) {
      const list = db.kv.list({ prefix })
      for await (const { key } of list) {
        log('deleted: ', key)
        promises.push(db.kv.delete(key))
      }
    }
    await Promise.all(promises)
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
    const reply = await api.context.db!.watchReply(request)
    // TODO use splices to await the outcome
    // probably with shortcuts to help say which IO actions had changes
    if (reply) {
      return fromOutcome(reply.outcome)
    }
  },
  request: async (params, api: IsolateApi<C>) => {
    const commit = params.commit as string
    const request = params.request as SolidRequest
    const pid = request.target
    assert(api.context.db, 'db not found')
    assert(api.context.exe, 'exe not found')
    assert(api.context.io, 'io not found')
    const { db, exe, io } = api.context
    const baseFs = FS.open(pid, commit, db)

    const { settled, pending } = await exe.execute(request, baseFs)

    if (settled) {
      const { reply, fs } = settled
      await io.inductFiles(reply, fs)
    } else {
      assert(pending, 'if not settled, must be pending')
      await Promise.all(pending.requests.map((request) => io.induct(request)))
    }
  },
  branch: async (params: Params, api: IsolateApi<C>) => {
    const { pid, sequence, commit } = params as {
      pid: PID
      commit: string
      sequence: number
    }
    const { io } = api.context
    assert(io, 'io not found')
    await io.branch(pid, commit, sequence)
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    assert(api.context.self, 'self not found')
    const db = await DB.create()
    const io = IO.create(db, api.context.self)
    const exe = Executor.create()
    // in testing, alter the context to support ducking the queue
    api.context = { db, io, exe }
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}
