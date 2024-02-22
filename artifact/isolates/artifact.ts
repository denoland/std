import { Debug } from '@utils'
import git from '$git'
import http from '$git/http/web'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import {
  ENTRY_BRANCH,
  InternalReply,
  InternalRequest,
  IsolateFunctions,
  IsolateLifecycle,
  Params,
  PID,
  Request,
} from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import IO from '@io/io.ts'
import DB from '../db.ts'
import FS from '../fs.ts'
import Cradle from '@/artifact/cradle.ts'
import { assert } from 'https://deno.land/std@0.203.0/assert/assert.ts'
import { Outcome } from '@/artifact/constants.ts'
import { serializeError } from 'https://esm.sh/serialize-error'

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
const request = {
  type: 'object',
  required: ['isolate'],
  properties: {
    isolate: {
      type: 'string',
    },
    pid: {
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
    },
  },
}

export const api = {
  ping: {
    type: 'object',
    description: 'Check queue processing system is alive',
    properties: {},
  },
  clone: repo,
  pull: repo,
  push: repo,
  init: repo,
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
  // subscribe to json by filepath and pid
  // subscribe to path in json, so we can subscribe to the output of io.json
  // subscribe to binary by filepath and pid - done by commit watching

  // requesting a patch would be done with the last known patch as cursor
}

export type C = { db: DB; io: IO; fs: FS; self: Cradle }

export const functions: IsolateFunctions = {
  ping: (params?: Params) => {
    log('ping', params)
    return params
  },
  // need to split the git functions out to be an isolate
  async init(params, api: IsolateApi<C>) {
    const start = Date.now()
    const repo = params.repo as string
    const [account, repository] = repo.split('/')
    const pid: PID = {
      account,
      repository,
      branches: [ENTRY_BRANCH],
    }
    // TODO handle existing repo

    const { fs } = memfs()
    const dir = '/'
    await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })

    const lockId = await api.context.db!.getHeadlock(pid)
    const { prettySize: size } = await api.context.fs!.update(pid, fs, lockId)
    await api.context.db!.releaseHeadlock(pid, lockId)
    log('snapshot size:', size)
    return { pid, size, elapsed: Date.now() - start }
  },
  async clone(params, api: IsolateApi<C>) {
    const start = Date.now()
    const repo = params.repo as string
    const [account, repository] = repo.split('/')
    const pid: PID = {
      account,
      repository,
      branches: [ENTRY_BRANCH],
    }
    // TODO handle existing repo

    // TODO use the fs option in the context, by loading an asserted blank fs

    const { fs } = memfs()
    const dir = '/'
    const url = `https://github.com/${account}/${repository}.git`
    log('cloning %s', url)
    // TODO make an index file without doing a full checkout
    // https://github.com/dreamcatcher-tech/artifact/issues/28
    await git.clone({ fs, http, dir, url })

    log('cloned')
    const lockId = await api.context.db!.getHeadlock(pid)
    const { prettySize: size } = await api.context.fs!.update(pid, fs, lockId)
    await api.context.db!.releaseHeadlock(pid, lockId)

    log('snapshot size:', size)
    return { pid, size, elapsed: Date.now() - start }
  },
  pull(params, api: IsolateApi<C>) {
    throw new Error('not implemented')
  },
  push(params, api: IsolateApi<C>) {
    throw new Error('not implemented')
  },
  apiSchema: (params: Params) => {
    const isolate = params.isolate as string
    const compartment = Compartment.create(isolate)
    return compartment.api
  },
  pierce: (params, api: IsolateApi<C>) => {
    log('pierce %o %o', params.isolate, params.functionName)
    return api.context.io!.induct(params as Request)
  },
  request: async (params, api: IsolateApi<C>) => {
    const request = params.request as InternalRequest
    const commit = params.commit as string
    const prior = params.prior as number | undefined
    // TODO wait for the prior to complete using prior key
    log('request %o %o', request.isolate, request.functionName)
    const compartment = Compartment.create(request.isolate)

    // TODO load up the fs based on the current commit, not latest commit
    const fs = await api.context.fs!.load(request.target)
    const isolateApi = IsolateApi.create(fs, commit)
    const functions = compartment.functions(isolateApi)
    const outcome: Outcome = {}
    try {
      outcome.result = await functions[request.functionName](request.params)
      log('self result: %o', outcome.result)
    } catch (errorObj) {
      log('self error', errorObj)
      outcome.error = serializeError(errorObj)
    }
    const { target, sequence } = request
    const reply: InternalReply = { target, sequence, outcome }
    await api.context.io!.induct(reply)
  },
}

export const lifecycles: IsolateLifecycle = {
  async '@@mount'(api: IsolateApi<C>) {
    assert(api.context.self, 'self not found')
    const db = await DB.create()
    const io = IO.create(db, api.context.self)
    const fs = FS.create(db)
    // in testing, alter the context to support ducking the queue
    api.context = { db, io, fs }
  },
  '@@unmount'(api: IsolateApi<C>) {
    return api.context.db!.stop()
  },
}
