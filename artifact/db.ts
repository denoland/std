import { ulid } from '$std/ulid/mod.ts'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import {
  Dispatch,
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
} from '@/artifact/constants.ts'
import { assert } from 'std/assert/assert.ts'
import debug from '$debug'
import { deserializeError, serializeError } from 'npm:serialize-error'

const log = debug('AI:db')

export default class DB {
  #kv!: Deno.Kv
  static async create() {
    const db = new DB()
    db.#kv = await openKv()
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
    await this.#kv.enqueue(msg)
    if (skipOutcome) {
      channel.close()
      return
    }
    return new Promise((resolve, reject) => {
      channel.onmessage = (event) => {
        const outcome = event.data as Outcome
        log('received outcome on %s', channel.name, outcome)
        channel.close()
        if (outcome.error) {
          reject(deserializeError(outcome.error))
        } else {
          resolve(outcome.result)
        }
      }
    })
  }

  async enqueueTail(dispatch: Dispatch, sequence: number) {
    const { nonce } = dispatch
    log('enqueueTail seq: %o nonce: %o', sequence, nonce)
    const tailKey = getTailKey(dispatch.pid, sequence)
    await this.#kv.set(tailKey, true)

    // TODO use the api to get the function to call directly
    const parameters = { dispatch, sequence }
    const msg: QMessage = { nonce, name: 'serial', parameters }
    const skipOutcome = true // else will deadlock
    await this.enqueueMsg(msg, skipOutcome)
  }
  async awaitTail(pid: PID, sequence: number) {
    if (sequence === 0) {
      return
    }
    const tailKey = getTailKey(pid, sequence - 1)
    log('awaitPrior %o', tailKey)
    const stream = this.#kv.watch([tailKey])
    for await (const [event] of stream) {
      log('awaitPrior event %o', event.key[event.key.length - 1])
      if (!event.versionstamp) {
        log('awaitPrior done')
        return
      }
    }
  }
  async tailDone(pid: PID, sequence: number) {
    const tailKey = getTailKey(pid, sequence)
    log('tailDone %o', tailKey)
    await this.#kv.delete(tailKey)
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
    const { pid, nonce } = action.payload // ? maybe move to meta key ?
    assertPid(pid)
    const key = getPoolKey(pid, nonce)
    log('pooling start %o', nonce)
    await this.#kv.set(key, action)
    log('pooling done %o', nonce)
  }
  awaitOutcome(dispatch: Dispatch): Promise<Outcome> {
    const { pid, nonce } = dispatch
    const poolKey = getPoolKey(pid, nonce)
    log('awaitOutcome %o', nonce)
    const channelKey = 'outcome-' + poolKey.join(':') // TODO escape : chars
    const channel = new BroadcastChannel(channelKey)
    return new Promise((resolve) => {
      channel.onmessage = (event) => {
        const outcome = event.data as Outcome
        log('channel message', outcome)
        channel.close()
        resolve(outcome)
      }
    })
  }
  announceOutcome(dispatch: Dispatch, outcome: Outcome) {
    const { pid, nonce } = dispatch
    const poolKey = getPoolKey(pid, nonce)
    log('announceOutcome %o', nonce)
    const channelKey = 'outcome-' + poolKey.join(':') // TODO escape : chars
    const channel = new BroadcastChannel(channelKey)
    channel.postMessage(outcome)
    // must be last, and one event loop later, else message not transmitted
    setTimeout(() => channel.close())
  }
  /**
   * Lock process:
   *  - optimistically try to grab the lock, atomically checking it is blank
   *  - if it failed, try get the pool item you are working for
   *  - if this pool item is not there, then you are done
   *  - loop again to get the lock
   */
  getHeadLock(pid: PID, action: Poolable) {
    assertPid(pid)
    const key = getHeadLockKey(pid)
    log('start getHeadLock %o', key)

    const lockId = 'headlock-' + ulid()
    const poolKey = getPoolKey(pid, action.payload.nonce)

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
const getTailKey = (pid: PID, sequence: number) => {
  assert(sequence >= 0, 'sequence must be positive')
  const { account, repository, branches } = pid
  return [KEYSPACES.TAIL, account, repository, ...branches, sequence]
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
