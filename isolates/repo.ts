import FS from '@/git/fs.ts'
import { sanitizeContext } from '@/isolates/artifact.ts'
import { assert, Debug, equal } from '@utils'
import { C, IsolateApi, isPID, PID, print } from '@/constants.ts'
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
  additionalProperties: false,
  properties: {
    pid: {
      type: 'object',
      required: ['id', 'account', 'repository', 'branches'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
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
  probe: { ...pid, description: 'Check if a repo or PID exists' },
  init: repo,
  clone: { ...pid, description: 'Clone a GitHub repo' },
  pull: repo,
  push: repo,
  rm: { ...pid, description: 'Remove everything about a PID' },
  logs: repo, // TODO use pid
}
export type Api = {
  rm: (params: { pid: PID }) => Promise<boolean>
  init: (params: { pid: PID }) => Promise<{ pid: PID; head: string }>
  clone: (
    params: { pid: PID },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
}
export const functions = {
  async probe(params: { pid: PID }, api: IsolateApi<C>) {
    const { pid } = params
    assert(isPID(pid), 'invalid params')

    const { db } = sanitizeContext(api)
    const head = await db.readHead(pid)
    if (head) {
      return { pid, head }
    }
  },
  async init(params: { id: string; repo: string }, api: IsolateApi<C>) {
    const start = Date.now()
    const { id, repo } = params
    const pid = pidFromRepo(id, repo)
    const probe = await functions.probe({ pid }, api)
    if (probe) {
      throw new Error('repo already exists: ' + params.repo)
    }
    const { db } = sanitizeContext(api)
    const fs = await FS.init(pid, db)
    assert(equal(fs.pid, pid), 'pid mismatch')
    const { commit: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  },
  async clone(params: { pid: PID }, api: IsolateApi<C>) {
    if (!api.isEffect) {
      throw new Error('Clone requires side effect capabilities')
    }
    if (api.isEffectRecovered) {
      // clean up the clone by wiping the repo, but make sure no existing repo
      // was there before the previous torn clone was started.
    }

    const start = Date.now()
    const { pid } = params
    const probe = await functions.probe({ pid }, api)
    if (probe) {
      throw new Error('repo already exists: ' + print(pid))
    }

    log('cloning %s', repo)
    const { db } = sanitizeContext(api)
    const fs = await FS.clone(pid, db)
    const { commit: head } = fs
    log('cloned', head)
    return { pid, head, elapsed: Date.now() - start }
  },
  pull() {
    throw new Error('not implemented')
  },
  push() {
    throw new Error('not implemented')
  },
  rm(params: { pid: PID }, api: IsolateApi<C>) {
    // TODO lock the whole repo in case something is running
    // batch atomic the deletes while we have the lock
    if (!api.isEffect) {
      throw new Error('Clone requires side effect capabilities')
    }
    if (api.isEffectRecovered) {
      // clean up the clone by wiping the repo, but make sure no existing repo
      // was there before the previous torn clone was started.
    }
    log('rm', params.pid)
    const { db } = sanitizeContext(api)
    FS.clearCache(params.pid)
    return db.rm(params.pid)
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
