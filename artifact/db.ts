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
import { debug } from 'https://deno.land/x/quiet_debug@v1.0.0/mod.ts'
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
  async awaitPrior(pid: PID, sequence: number) {
    if (sequence === 0) {
      return
    }
    const tailKey = getTailKey(pid, sequence - 1)
    log('awaitPrior %o', tailKey)
    for await (const [event] of this.#kv.watch([tailKey])) {
      log('awaitPrior event %o', event)
      if (!event.versionstamp) {
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
    const poolKey = getPoolKey(pid, nonce)
    log('watch pool %o', poolKey)
    const stream = this.#kv.watch([poolKey])
    const iterator = stream[Symbol.asyncIterator]()
    // guarantee key is empty
    const first = await iterator.next()
    assert(!first.value[0].versionstamp, 'pool key must be empty')
    log('watchPool first %o', first)
    await this.#kv.set(poolKey, action)
    for await (const [event] of iterator) {
      if (!event.versionstamp) {
        return
      }
    }
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
    channel.close()
  }
  async getHeadLock(pid: PID, abortController?: AbortController) {
    assertPid(pid)
    const headLockKey = getHeadLockKey(pid)
    log('headLockKey %o', headLockKey)
    const start = Date.now()
    for await (const [event] of this.#kv.watch([headLockKey])) {
      log('headLock event %o', event)
      if (!event.versionstamp) {
        const lockId = ulid()
        // TODO use atomics
        await this.#kv.set(headLockKey, lockId, { expireIn: 5000 })
        log(`headLock successful after ${Date.now() - start}ms`)
        return lockId
      }
    }
    const elapsed = Date.now() - start
    throw new Error(`headLock unsuccessful after ${elapsed}ms`)
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
    const entries = this.#kv.list({ prefix })
    const keys = []
    const values: Poolable[] = []
    for await (const entry of entries) {
      const value = entry.value as Poolable
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
