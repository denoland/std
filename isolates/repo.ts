import FS from '@/git/fs.ts'
import DB from '@/db.ts'
import { assert, Debug } from '@utils'
import { C, IsolateApi, isPID, PID } from '@/constants.ts'
import { pidFromRepo } from '@/keys.ts'
const log = Debug('AI:isolates:repo')
/**
 * Isolate that deals with repo related operations.
 * Tightly integrated with the Artifact isolate.
 * If the Artifact isolate is execution, the repo isolate would be storage.
 */
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
export const api = {
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
  logs: repo, // TODO use pid
}
export type Api = {
  rm: (params: { repo: string }) => Promise<void>
}
export const functions = {
  async probe(params: { repo?: string; pid?: PID }, api: IsolateApi<C>) {
    let { pid, repo } = params
    if (repo) {
      pid = pidFromRepo(repo)
    }
    assert(isPID(pid), 'invalid params')

    const { db } = getContext(api)
    const head = await db.readHead(pid)
    if (head) {
      return { pid, head }
    }
  },
  async init(params: { repo: string }, api: IsolateApi<C>) {
    const start = Date.now()
    const probe = await functions.probe(params, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }
    const { db } = getContext(api)
    const fs = await FS.init(params.repo, db)
    const { pid, commit: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  },
  async clone(params: { repo: string }, api: IsolateApi<C>) {
    // this should go into the queue of things to do
    // there is an atomic queue, but also a job queue to move work closer to the
    // source
    // ? could this be a pierce into itself ?
    // so the cradle would just all pierce with this action ?
    // if not, how else would we queue the work and then get an outcome back ?

    if (!api.isEffect) {
      throw new Error('Clone requires side effect capabilities')
    }
    if (api.isEffectRecovered) {
      // clean up the clone by wiping the repo, but make sure no existing repo
      // was there before the previous torn clone was started.
    }

    const start = Date.now()
    const { repo } = params
    const probe = await functions.probe({ repo }, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }

    log('cloning %s', repo)
    const { db } = getContext(api)
    const fs = await FS.clone(repo, db)
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
  async rm(params: { repo: string }, api: IsolateApi<C>) {
    // TODO lock the whole repo in case something is running
    // TODO maybe have a top level key indicating if the repo is active or not
    // which can get included in the atomic checks for all activities
    const pid = pidFromRepo(params.repo)
    const { db } = getContext(api)
    FS.clearCache(pid)
    await db.rm(pid)
  },
  async logs(params: { repo: string }) {
    // TODO convert logs to a splices query
    // log('logs', params.repo)
    // const pid = pidFromRepo(params.repo)
    // const { db } = this.#api.context
    // assert(db, 'db not found')
    // const fs = await FS.openHead(pid, db)
    // const logs = await fs.logs()
    // return logs
  },
}
const getContext = (api: IsolateApi<C>): C => {
  assert(api.context, 'context not found')
  const { db, exe } = api.context
  assert(db instanceof DB, 'db not found')
  assert(exe, 'exe not found')

  return { db, exe }
}
