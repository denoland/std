import { BLOB_META_KEY, get, getMeta } from '@kitsonk/kv-toolbox/blob'
import { batchedAtomic } from '@kitsonk/kv-toolbox/batched_atomic'
import * as keys from './keys.ts'
import { PID, Poolable } from '@/constants.ts'
import { assert, Debug, openKv, sha1 } from '@utils'
import { Atomic } from './atomic.ts'
import { QueueMessage } from '@/constants.ts'
import { ulid } from '@utils'

const log = Debug('AI:db')
export default class DB {
  #kv: Deno.Kv
  private constructor(kv: Deno.Kv) {
    this.#kv = kv
  }
  static async create() {
    const kv = await openKv()
    const db = new DB(kv)
    return db
  }
  stop() {
    return this.#kv.close()
  }
  async hasPoolable(poolable: Poolable) {
    const key = keys.getPoolKey(poolable)
    const entry = await this.#kv.get(key)
    return !!entry.versionstamp
  }
  async getPooledActions(pid: PID) {
    const prefix = keys.getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix })
    const poolKeys = []
    const pool: Poolable[] = []
    for await (const entry of entries) {
      // TODO test if range would not get deeply nested items
      if (entry.key.length !== prefix.length + 1) {
        continue
      }
      poolKeys.push(entry.key)
      pool.push(entry.value)
    }
    log('getPooledActions done %o', poolKeys.length)
    return { poolKeys, pool }
  }
  async readHead(pid: PID): Promise<string | undefined> {
    const key = keys.getHeadKey(pid)
    log('getHead %o', key)
    const head = await this.#kv.get<string>(key)
    if (head.versionstamp) {
      assert(sha1.test(head.value), 'Invalid head: ' + head.value)
      return head.value
    }
  }
  async rm(pid: PID) {
    const prefix = keys.getRepoBase(pid)
    log('rm %o', prefix)
    const all = this.#kv.list({ prefix })
    const deletes = []
    for await (const { key } of all) {
      log('deleted: ', key)
      deletes.push(this.#kv.delete(key))
    }
    await Promise.all(deletes)
    return !!deletes.length
  }
  watchHead(pid: PID, signal?: AbortSignal) {
    // TODO this should be unified to have a single one for the whole db
    // instance
    const abort = new AbortController()
    // TODO may need to add this to a hook in stop()
    // TODO offer a watchCommits function that is every guaranteed commit with
    // no skips in between
    signal?.addEventListener('abort', () => {
      abort.abort()
    })
    const key = keys.getHeadKey(pid)
    const stream = this.#kv.watch<string[]>([key])
    return stream.pipeThrough(
      new TransformStream({
        start(controller) {
          abort.signal.addEventListener('abort', () => {
            controller.terminate()
          })
        },
        transform([event], controller) {
          if (event.versionstamp) {
            assert(sha1.test(event.value), 'Invalid head: ' + event.value)
            controller.enqueue(event.value)
          }
        },
      }),
    )
  }
  async blobExists(key: Deno.KvKey) {
    const meta = await getMeta(this.#kv, key)
    return !!meta.versionstamp
  }
  async blobGet(key: Deno.KvKey) {
    const result = await get(this.#kv, key)
    return result
  }
  async blobSet(key: Deno.KvKey, value: ArrayBufferLike) {
    await batchedAtomic(this.#kv).check({
      key,
      versionstamp: null,
    }).setBlob(key, value).commit()
  }
  async listImmediateChildren(prefix: Deno.KvKey) {
    const results = []
    for await (const item of this.#kv.list({ prefix })) {
      const end = item.key.slice(prefix.length)
      if (end.length === 1) {
        results.push(end[0])
      }
      if (end.length === 2) {
        // TODO see what happens if the keys are named to clash with this
        if (end[1] === BLOB_META_KEY) {
          results.push(end[0])
        }
      }
    }
    return results
  }
  listen(handler: (message: QueueMessage) => Promise<void>) {
    this.#kv.listenQueue(handler)
  }
  atomic() {
    return Atomic.create(this.#kv)
  }

  async lockRepo(pid: PID) {
    const key = keys.getRepoLockKey(pid)
    const lockId = ulid()
    const result = await this.#kv.atomic().check({ key, versionstamp: null })
      .set(key, lockId)
      .commit()
    if (result.ok) {
      return true
    }
    // really just want to know that this process set the lock and is now
    // releasing it
    // the release would be part of the atomics, since it needs to be at the
    // exact same time as the commit is stored, else can fail
  }
  async watchSideEffectsLock(pid: PID, abort: AbortController) {
    // rudely snatch the lock
    const key = keys.getEffectsLockKey(pid)
    const lockId = ulid()
    const { versionstamp, ok } = await this.#kv.set(key, lockId)
    assert(ok, 'Failed to set lock')
    const stream = this.#kv.watch<string[]>([key])
    const reader = stream.getReader()
    abort.signal?.addEventListener('abort', () => {
      reader.cancel()
    })
    const read = async () => {
      while (stream.locked) {
        const { value, done } = await reader.read()
        if (done) {
          // should this be abort ?
          return
        }
        const lock = value[0]
        if (!lock.versionstamp) {
          continue
        }
        if (lock.versionstamp === versionstamp) {
          continue
        }
        abort.abort()
      }
    }
    read()
    return { key, value: lockId, versionstamp }
  }
}

// Test the db with the real KV opened up
