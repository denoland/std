import * as keys from './keys.ts'
import { ulid } from '$std/ulid/mod.ts'
import { get, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import { PID, Poolable, Reply, Request } from '@/artifact/constants.ts'
import { assert, Debug, openKv } from '@utils'

const log = Debug('AI:db')
export default class DB {
  #kv!: Deno.Kv
  get kv() {
    return this.#kv
  }
  static async create() {
    const db = new DB()
    db.#kv = await openKv()
    return db
  }
  stop() {
    return this.#kv.close()
  }
  async watchReply(request: Request) {
    const key = keys.getPoolKey(request)
    log('watchReply %o', key)
    const stream = this.#kv.watch<Reply[]>([key])
    for await (const [event] of stream) {
      if (!event.versionstamp) {
        continue
      }
      const reply: Reply = event.value
      log('awaitOutcome done %o', reply)
      return reply
    }
    throw new Error('watchReply failed')
  }
  // maybe do need an outcome type, to avoid flickering on replies
  // so once a reply is pooled, move its keys over to be outcome
  async loadIsolateFs(pid: PID) {
    const fsKey = keys.getRepoKey(pid)
    log('loadSnapshot %o', fsKey)
    const blobKey = await this.#kv.get<string[]>(fsKey)
    assert(blobKey.value, 'repo not found: ' + fsKey.join('/'))
    const uint8 = await get(this.#kv, blobKey.value)
    return uint8
  }
  async updateIsolateFs(pid: PID, uint8: Uint8Array, lockId: string) {
    // TODO use the versionstamp as the lockId to avoid the key lookup
    const lockKey = keys.getHeadLockKey(pid)
    const currentLock = await this.#kv.get(lockKey)
    if (currentLock.value !== lockId) {
      throw new Error('lock mismatch: ' + lockKey.join('/') + ' ' + lockId)
    }

    const fsKey = keys.getRepoKey(pid)
    const blobKey = [...fsKey, ulid()]
    await set(this.#kv, blobKey, uint8)

    const result = await this.#kv.atomic().check(currentLock).set(
      fsKey,
      blobKey,
    ).commit()
    if (!result.ok) {
      await this.#kv.delete(blobKey)
      throw new Error('lock mismatch: ' + lockKey.join('/') + ' ' + lockId)
    }
  }
  async addToPool(poolable: Poolable) {
    // TODO handle IPCs too
    const key = keys.getPoolKey(poolable)
    log('pooling start %o', poolable.id)
    await this.#kv.atomic().check({ key, versionstamp: null }).set(
      key,
      poolable,
    )
      .commit()
    log('pooling done %o', poolable.id)
    return key
  }
  async getHeadlock(pid: PID) {
    const key = keys.getHeadLockKey(pid)
    log('start getHeadLock %o', key)

    const lockId = 'headlock-' + ulid()
    let result = { ok: false }
    while (!result.ok) {
      let current = await this.#kv.get(key)
      if (current.versionstamp) {
        log('headlock failed, waiting for lock release')
        for await (const [event] of this.#kv.watch([key])) {
          if (!event.versionstamp) {
            current = event
            break
          }
        }
        log('headlock released')
      }
      result = await this.#kv.atomic().check(current).set(key, lockId, {
        expireIn: 5000,
      }).commit()
    }
    return lockId
  }
  getHeadlockMaybe(request: Request) {
    const key = keys.getHeadLockKey(request.target)
    log('start getHeadLock %o', key)

    const lockId = 'headlock-' + ulid()
    const poolKey = keys.getPoolKey(request)

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
    const headLockKey = keys.getHeadLockKey(pid)
    const existing = await this.#kv.get(headLockKey)
    if (existing.value !== lockId) {
      throw new Error(
        'Headlock mismatch: ' + headLockKey.join('/') + ' ' + lockId,
      )
    }
    await this.#kv.atomic().check(existing).delete(headLockKey).commit()
  }
  async getPooledActions(pid: PID) {
    const prefix = keys.getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix })
    const poolKeys = []
    const pool: Poolable[] = []
    for await (const entry of entries) {
      const value = entry.value
      // TODO check the length, since deeper branches might be included
      poolKeys.push(entry.key)
      pool.push(value)
    }
    log('getPooledActions done %o', poolKeys.length)
    return { poolKeys, pool }
  }
  async deletePool(keys: Deno.KvKey[]) {
    const ids = keys.map((key) => key[key.length - 1])
    log('deletePool %o', ids)
    await Promise.all(keys.map((key) => this.#kv.delete(key)))
  }
}
