import { ulid } from '$std/ulid/mod.ts'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import {
  Dispatch,
  IoStruct,
  KEYSPACES,
  PID,
  QueuedDispatch,
} from './constants.ts'
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
  listenQueue(callback: (dispatch: Dispatch) => Promise<void>) {
    log('listen queue')
    assert(this.#kv, 'db not open')
    this.#kv.listenQueue(callback)
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
  async watchPool(action: Dispatch) {
    const { pid } = action
    assertPid(pid)
    const poolKey = getPoolKey(pid)
    log('watch pool %o', poolKey)
    const stream = this.#kv.watch([poolKey])
    const iterator = stream[Symbol.asyncIterator]()
    // guarantee key is empty
    const first = await iterator.next()
    assert(!first.value[0].versionstamp)
    log('watchPool first %o', first)
    await this.#kv.set(poolKey, action)
    return iterator
  }
  async getHeadLock(pid: PID) {
    assertPid(pid)
    const headLockKey = getHeadLockKey(pid)
    log('headLockKey %o', headLockKey)
    const lockId = ulid()
    await this.#kv.set(headLockKey, lockId) // naively assume we have the lock
    return lockId
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
      const tailKeyPrefix = getTailKeyPrefix(pid)
      const sequence = parseInt(key)
      const tailKey = [...tailKeyPrefix, sequence]
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
    const prefix = getPoolKey(pid)
    prefix.pop()
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list({ prefix })
    const keys = []
    const values: Dispatch[] = []
    for await (const entry of entries) {
      const value = entry.value as Dispatch
      keys.push(entry.key)
      values.push(value)
    }
    return { keys, values }
  }
  async deletePool(keys: Deno.KvKey[]) {
    log('deletePool %o', keys)
    await Promise.all(keys.map((key) => this.#kv.delete(key)))
  }
  async releaseHeadlock(pid: PID, lockId: string) {
    log('releaseHeadlock %s', lockId)
    const headLockKey = getHeadLockKey(pid)
    // TODO check lock is valid
    await this.#kv.delete(headLockKey)
  }
}
const getPoolKey = (pid: PID) => {
  const { account, repository, branches } = pid
  // ulid is external, else use source pid and sequence
  return [KEYSPACES.POOL, account, repository, ...branches, ulid()]
}
const getHeadLockKey = (pid: PID) => {
  const { account, repository, branches } = pid
  return [KEYSPACES.HEADLOCK, account, repository, ...branches]
}
const getTailKeyPrefix = (pid: PID) => {
  const { account, repository, branches } = pid
  // tail, sequence
  return [KEYSPACES.TAIL, account, repository, ...branches]
}
const openKv = async () => {
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
