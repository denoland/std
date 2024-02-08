import { ulid } from '$std/ulid/mod.ts'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import {
  Dispatch,
  IoStruct,
  KEYSPACES,
  Outcome,
  PID,
  Poolable,
  QueuedDispatch,
} from '@/artifact/constants.ts'
import { assert } from 'std/assert/assert.ts'
import debug from '$debug'
import { PROCTYPE } from '@/artifact/constants.ts'
const log = debug('AI:db')

export default class DB {
  #kv!: Deno.Kv
  static async create() {
    const db = new DB()
    db.#kv = await openKv()
    return db
  }
  stop() {
    this.#kv.close()
  }
  listenQueue(callback: (msg: QueuedDispatch) => Promise<void>) {
    return this.#kv.listenQueue(callback)
  }
  async awaitTail(pid: PID, sequence: number) {
    if (sequence === 0) {
      return
    }
    const tailKey = getTailKey(pid, sequence - 1)
    log('awaitPrior %o', tailKey)
    let count = 0
    while (count++ < 1000) {
      const tail = await this.#kv.get(tailKey)
      if (!tail.versionstamp) {
        log('awaitPrior done after %d attempts', count)
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
    log('pooling start %o', key)
    await this.#kv.set(key, action)
    log('pooling done')
  }
  awaitOutcome(dispatch: Dispatch): Promise<Outcome> {
    const { pid, nonce } = dispatch
    const poolKey = getPoolKey(pid, nonce)
    log('awaitOutcome %o', poolKey)
    const channelKey = poolKey.join(':') // TODO escape chars
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
    log('announceOutcome %o', poolKey)
    const channelKey = poolKey.join(':') // TODO escape chars
    const channel = new BroadcastChannel(channelKey)
    channel.postMessage(outcome)
    setTimeout(() => channel.close())
  }
  /**
   * Lock process:
   *  - optimistically try to grab the lock, atomically checking it is blank
   *  - if it failed, try get the pool item you are working for
   *  - if this pool item is not there, then you are done
   *  - loop again to get the lock
   */
  async getHeadLock(pid: PID, action: Poolable) {
    assertPid(pid)
    const key = getHeadLockKey(pid)
    log('start getHeadLock %o', key)

    const lockId = ulid()
    let result = { ok: false }
    let count = 0
    const poolKey = getPoolKey(pid, action.payload.nonce)
    while (!result.ok && count++ < 100) {
      result = await this.#kv.atomic().check({ key, versionstamp: null })
        .set(key, lockId, { expireIn: 5000 }).commit()
      if (!result.ok) {
        const existing = await this.#kv.get(poolKey)
        if (!existing) {
          log('pool item not found, so no headlock needed')
          return
        }
      }
    }
    if (!result.ok) {
      throw new Error(`Failed to get head lock after ${count} attempts`)
    }
    log('getHeadLock successful', lockId)
    return lockId
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
  async enqueueIo(pid: PID, io: IoStruct) {
    log('enqueueIo %o', io)
    await Promise.all([
      this.#enqueueSerial(pid, io[PROCTYPE.SERIAL]),
      this.#enqueueParallel(pid, io[PROCTYPE.PARALLEL]),
    ])
  }
  async #enqueueSerial(pid: PID, serial: IoStruct[PROCTYPE.SERIAL]) {
    const ascendingKeys = sort(Object.keys(serial.inputs))
    for (const key of ascendingKeys) {
      const dispatch = serial.inputs[key]
      const sequence = parseInt(key)
      const tailKey = getTailKey(pid, sequence)
      await this.#kv.set(tailKey, true)
      const queuedDispatch: QueuedDispatch = { dispatch, sequence }
      await this.#kv.enqueue(queuedDispatch)
    }
  }
  async #enqueueParallel(
    pid: PID,
    parallel: IoStruct[PROCTYPE.PARALLEL],
  ) {
  }
  async getPooledActions(pid: PID) {
    const prefix = getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix })
    const keys = []
    const values: Poolable[] = []
    for await (const entry of entries) {
      const value = entry.value
      keys.push(entry.key)
      values.push(value)
    }
    return { keys, values }
  }
  async deletePool(keys: Deno.KvKey[]) {
    log('deletePool %o', keys)
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
const sort = (keys: string[]) => keys.sort((a, b) => parseInt(a) - parseInt(b))
