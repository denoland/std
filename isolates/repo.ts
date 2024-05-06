import FS from '@/git/fs.ts'
import { sanitizeContext } from '@/isolates/artifact.ts'
import { assert, Debug, equal } from '@utils'
import { C, IsolateApi, isPID, PID, print } from '@/constants.ts'
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

export const pid = {
  type: 'object',
  additionalProperties: false,
  properties: {
    pid: {
      type: 'object',
      required: ['repoId', 'account', 'repository', 'branches'],
      additionalProperties: false,
      properties: {
        repoId: {
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
  init: { ...pid, description: 'Initialize a new repo' },
  clone: { ...pid, description: 'Clone a GitHub repo' },
  rm: { ...pid, description: 'Remove everything about a PID' },
}
export type Api = {
  probe: (params: { pid: PID }) => Promise<{ pid: PID; head: string }>
  init: (params: { pid: PID }) => Promise<{ pid: PID; head: string }>
  clone: (
    params: { pid: PID },
  ) => Promise<{ pid: PID; head: string; elapsed: number }>
  rm: (params: { pid: PID }) => Promise<boolean>
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
  async init(params: { pid: PID }, api: IsolateApi<C>) {
    const start = Date.now()
    const { pid } = params
    const probe = await functions.probe({ pid }, api)
    if (probe) {
      throw new Error('repo already exists: ' + print(pid))
    }
    const { db } = sanitizeContext(api)
    const fs = await FS.init(pid, db)
    assert(equal(fs.pid, pid), 'pid mismatch')
    const { oid: head } = fs
    return { pid, head, elapsed: Date.now() - start }
  },
  pull() {
    throw new Error('not implemented')
  },
  push() {
    throw new Error('not implemented')
  },
}
