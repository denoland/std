import { ulid } from '$std/ulid/mod.ts'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import {
  IoStruct,
  KEYSPACES,
  Outcome,
  PID,
  Poolable,
  PROCTYPE,
  QCallback,
  QMessage,
  QUEUE_TYPES,
  QueuedDispatch,
  Request,
} from '@/artifact/constants.ts'
import { assert } from 'std/assert/assert.ts'
import { Debug } from '@utils'
import { deserializeError, serializeError } from 'npm:serialize-error'

const log = Debug('AI:db')
type Queue = (msg: QMessage) => Promise<void>
export default class DB {
  #kv!: Deno.Kv
  #queue: Queue = async (msg: QMessage) => {
    await this.#kv.enqueue(msg, { backoffSchedule: [] })
  }
  static async create(queue?: Queue) {
    const db = new DB()
    db.#kv = await openKv()
    if (queue) {
      db.#queue = queue
    }
    return db
  }
  stop() {
    return this.#kv.close()
  }
  listenQueue(callback: QCallback) {
    return this.#kv.listenQueue(async (msg: QMessage) => {
      log('listenQueue received', msg.name, msg.nonce)
      assert(msg.nonce, 'nonce is required')
      const channel = new BroadcastChannel('queue-' + msg.nonce)
      const outcome: Outcome = {}
      try {
        outcome.result = await callback(msg)
      } catch (error) {
        outcome.error = serializeError(error)
      }
      log('announcing %s', channel.name)
      channel.postMessage(outcome)
      setTimeout(() => channel.close())
    })
  }
  async enqueueMsg(msg: QMessage, skipOutcome?: boolean) {
    const channel = new BroadcastChannel('queue-' + msg.nonce)
    await this.#queue(msg)
    if (skipOutcome) {
      // TODO WARNING this is a detached promise, so the engine can fault here
      channel.close()
      return
    }
    return new Promise((resolve, reject) => {
      channel.onmessage = (event) => {
        const outcome = event.data as Outcome
        log('received outcome on %s', channel.name)
        channel.close()
        if (outcome.error) {
          reject(deserializeError(outcome.error))
        } else {
          resolve(outcome.result)
        }
      }
    })
  }
  async enqueueParallel(dispatch: Request, sequence: number) {
    log('enqueueParallel %o')
    const params = { dispatch, sequence }
    const msg: QMessage = { nonce: 'TODO', name: 'parallel', params }
    const skipOutcome = true // else will deadlock
    await this.enqueueMsg(msg, skipOutcome)
  }
  async enqueueSerial(dispatch: Request, sequence: number) {
    log('enqueueTail seq: %o nonce: %o', sequence)
    const serialKey = getSerialKey(dispatch.target, sequence)
    await this.#kv.set(serialKey, true)

    // TODO use the api to get the function to call directly
    // so that with the queue disabled, local testing still works
    const params = { dispatch, sequence }
    const msg: QMessage = { nonce: 'TODO', name: 'serial', params }
    const skipOutcome = true // else will deadlock
    await this.enqueueMsg(msg, skipOutcome)
  }
  async awaitTail(pid: PID, sequence: number) {
    if (sequence === 0) {
      return
    }
    const serialKey = getSerialKey(pid, sequence - 1)
    log('awaitPrior %o', serialKey)
    const stream = this.#kv.watch([serialKey])
    for await (const [event] of stream) {
      log('awaitPrior event %o', event.key[event.key.length - 1])
      if (!event.versionstamp) {
        log('awaitPrior done')
        return
      }
    }
  }
  async serialDone(pid: PID, sequence: number) {
    const serialKey = getSerialKey(pid, sequence)
    log('serialDone %o', serialKey)
    await this.#kv.delete(serialKey)
  }
  async loadIsolateFs(pid: PID) {
    assertPid(pid)
    const { account, repository, branches } = pid
    const key = [KEYSPACES.REPO, account, repository, ...branches]
    log('loadSnapshot %o', key)
    const uint8 = await get(this.#kv, key)
    return uint8
  }
  async updateIsolateFs(pid: PID, uint8: Uint8Array) {
    await set(this.#kv, [
      KEYSPACES.REPO,
      pid.account,
      pid.repository,
      ...pid.branches,
    ], uint8)
  }
  async poolAction(action: Poolable) {
    // const { pid } = action.payload // ? maybe move to meta key ?
    // assertPid(pid)
    // const key = getPoolKey(pid, nonce)
    // log('pooling start %o', nonce)
    // await this.#kv.set(key, action)
    // log('pooling done %o', nonce)
  }
  awaitOutcome(dispatch: Request): Promise<Outcome> {
    // const { target, nonce } = dispatch
    // const poolKey = getPoolKey(target, nonce)
    // log('awaitOutcome %o', nonce)
    // const channelKey = 'outcome-' + poolKey.join(':') // TODO escape : chars
    // const channel = new BroadcastChannel(channelKey)
    return new Promise((resolve) => {
      // channel.onmessage = (event) => {
      //   const outcome = event.data as Outcome
      //   log('channel message', outcome)
      //   channel.close()
      //   resolve(outcome)
      // }
    })
  }
  announceOutcome(dispatch: Request, outcome: Outcome) {
    // const { target, nonce } = dispatch
    // const poolKey = getPoolKey(target, nonce)
    // log('announceOutcome %o', nonce)
    // const channelKey = 'outcome-' + poolKey.join(':') // TODO escape : chars
    // const channel = new BroadcastChannel(channelKey)
    // channel.postMessage(outcome)
    // // must be last, and one event loop later, else message not transmitted
    // setTimeout(() => channel.close())
  }
  getHeadLock(pid: PID, action: Poolable) {
    assertPid(pid)
    const key = getHeadLockKey(pid)
    log('start getHeadLock %o', key)

    const lockId = 'headlock-' + ulid()
    const poolKey = getPoolKey(pid, 'TODO')

    const headStream = this.#kv.watch([key])[Symbol.asyncIterator]()

    const closeStream = () => {
      assert(headStream.return)
      headStream.return()
    }

    return new Promise<string | void>((resolve) => {
      const loop = async () => {
        let result = { ok: false }
        while (!result.ok) {
          // TODO wasted round trip to get pool on retry, but should check if
          // the pool item exists as part of atomics.  Trick is to determine
          // that this was why !result.ok
          const existing = await this.#kv.get(poolKey)
          if (!existing.versionstamp) {
            log('pool item not found, so no headlock needed')
            closeStream()
            resolve()
          }
          result = await this.#kv.atomic().check({ key, versionstamp: null })
            .set(key, lockId, { expireIn: 5000 }).commit()
          if (!result.ok) {
            log('headlock failed, waiting for lock release')
            await headStream.next()
            log('headlock released')
          }
        }
        log('lock acquired %o', lockId)
        closeStream()
        resolve(lockId)
      }
      loop()
    })
  }
  async releaseHeadlock(pid: PID, lockId: string) {
    log('releaseHeadlock %s', lockId)
    const headLockKey = getHeadLockKey(pid)
    const existing = await this.#kv.get(headLockKey)
    if (existing.value !== lockId) {
      throw new Error(
        'Headlock mismatch: ' + headLockKey.join('/') + ' ' + lockId,
      )
    }
    await this.#kv.delete(headLockKey)
  }
  async getPooledActions(pid: PID) {
    const prefix = getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix })
    const keys = []
    const actions: Poolable[] = []
    for await (const entry of entries) {
      const value = entry.value
      keys.push(entry.key)
      actions.push(value)
    }
    log('getPooledActions done %o', keys.length)
    return { keys, actions }
  }
  async deletePool(keys: Deno.KvKey[]) {
    const nonces = keys.map((key) => key[key.length - 1])
    log('deletePool %o', nonces)
    await Promise.all(keys.map((key) => this.#kv.delete(key)))
  }
}
const getPoolKeyPrefix = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.POOL, account, repository, ...branches]
}
const getPoolKey = (pid: PID, nonce: string) => {
  return [...getPoolKeyPrefix(pid), nonce]
}
const getHeadLockKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.HEADLOCK, account, repository, ...branches]
}
const getSerialKey = (pid: PID, sequence: number) => {
  assert(sequence >= 0, 'sequence must be positive')
  const { account, repository, branches } = pid
  return [KEYSPACES.SERIAL, account, repository, ...branches, sequence]
}
const isDenoDeploy = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined
const openKv = async () => {
  if (isDenoDeploy) {
    return Deno.openKv()
  }

  const KEY = 'DENO_KV_PATH'
  let path = ':memory:'
  const permission = await Deno.permissions.query({
    name: 'env',
    variable: KEY,
  })
  if (permission.state === 'granted') {
    const env = Deno.env.get(KEY)
    if (env) {
      path = env
    }
  }
  log('open kv', path)
  return Deno.openKv(path)
}
const assertPid = (pid: PID) => {
  assert(pid.account, 'account is required')
  assert(pid.repository, 'repository is required')
  assert(pid.branches[0], 'branch is required')
  const githubRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
}
