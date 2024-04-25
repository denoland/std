import { pushable } from 'it-pushable'
import { BLOB_META_KEY, get, getMeta } from '@kitsonk/kv-toolbox/blob'
import { batchedAtomic } from '@kitsonk/kv-toolbox/batched_atomic'
import * as keys from './keys.ts'
import { freezePid, PID, Poolable, print, Splice } from '@/constants.ts'
import { assert, Debug, openKv, posix, sha1 } from '@utils'
import { Atomic } from './atomic.ts'
import { QueueMessage } from '@/constants.ts'
import { ulid } from 'ulid'
import FS from '@/git/fs.ts'

const log = Debug('AI:db')
export default class DB {
  #kvStore: Deno.Kv
  #abort = new AbortController()
  #aborts = new Set<AbortController>()

  private constructor(kv: Deno.Kv) {
    this.#kvStore = kv
  }
  static async create() {
    const kv = await openKv()
    watchUndelivered(kv)
    const db = new DB(kv)
    return db
  }
  get #kv() {
    if (this.#abort.signal.aborted) {
      throw new Error('DB is closed')
    }
    return this.#kvStore
  }
  stop() {
    if (this.#abort.signal.aborted) {
      return
    }
    const kv = this.#kv
    this.#abort.abort()
    for (const abort of this.#aborts) {
      abort.abort()
    }
    return kv.close()
  }
  async hasPoolables(pid: PID) {
    const counterKey = keys.getPoolCounterKey(pid)
    const markerKey = keys.getPoolMarkerKey(pid)
    const many = [counterKey, markerKey]
    const [counter, marker] = await this.#kv.getMany<bigint[]>(many)
    return hasPoolables(counter, marker)
  }
  async getPooledActions(pid: PID) {
    const prefix = keys.getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix }, { batchSize: 1000 })
    const poolKeys = []
    const pool: Poolable[] = []
    for await (const entry of entries) {
      // TODO test if range would not get deeply nested items
      if (entry.key.length !== prefix.length + 1) {
        continue
      }
      const id = entry.key[entry.key.length - 1]
      if (id === keys.POOL_COUNTER || id === keys.POOL_MARKER) {
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
  /**
   * Will return an async iterable of Splices which are in order and do not skip
   * any intermediaries.  The parent Splice will always immediately precede the
   * child Splice.
   *
   * If after is not provided, then we use the head to start with.  If after is
   * provided, then everything up to that point will be retrieved.
   * @param {string} pid - The branch to watch
   * @param {string} [path] - Optional path of a file to watch
   * @param {string} [after] - Optional commit to start from
   * @param {AbortSignal} [signal] - Optional abort signal
   * @returns
   */
  watchSplices(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    freezePid(pid)
    if (after) {
      assert(sha1.test(after), 'Invalid from: ' + after)
      throw new Error('not implemented')
    }
    if (path) {
      assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
    }
    const abort = new AbortController()
    this.#aborts.add(abort)
    signal?.addEventListener('abort', () => {
      abort.abort()
    })
    const sink = pushable<Splice>({ objectMode: true })
    const buffer = pushable<Promise<Splice>>({ objectMode: true })
    abort.signal.addEventListener('abort', () => {
      this.#aborts.delete(abort)
      sink.return()
      buffer.return()
    })

    const watch = this.#kv.watch<string[]>([keys.getHeadKey(pid)])
    const pipe = async () => {
      for await (const [result] of streamToIt(watch, abort.signal)) {
        if (!result.versionstamp) {
          continue
        }
        const commit = result.value
        if (commit === after) {
          // TODO maybe after is a waste, since head is all that matters ?
          continue
        }
        buffer.push(this.#getSplice(pid, commit, path))
      }
    }
    pipe().catch(buffer.throw)
    // TODO once piece replies are tracked directly, this can be removed
    const drain = async () => {
      let last: Splice | undefined
      for await (const promise of buffer) {
        const splice = await promise
        if (!last) {
          sink.push(splice)
          last = splice
          continue
        }

        const splices = [splice]
        while (splices[0].commit.parent[0] !== last.oid) {
          console.log('splice race', print(splice.pid), splices.length)
          const primeParent = splices[0].commit.parent[0]
          const next = await this.#getSplice(pid, primeParent, path)
          splices.unshift(next)
        }
        last = splice
        splices.map((s) => sink.push(s))
      }
    }
    drain().catch(sink.throw)
    return sink
  }
  async #getSplice(pid: PID, oid: string, path?: string) {
    const fs = FS.open(pid, oid, this)
    const commit = await fs.getCommit()
    const timestamp = commit.committer.timestamp * 1000
    const splice: Splice = { pid, oid, commit, timestamp, changes: {} }
    if (path) {
      if (await fs.exists(path)) {
        const { oid } = await fs.readBlob(path)
        const patch = await fs.read(path) // TODO check caching makes this fast
        splice.changes[path] = { oid, patch }
      }
    }
    return splice
  }
}

const watchUndelivered = async (kv: Deno.Kv) => {
  for await (const [undelivered] of kv.watch([keys.UNDELIVERED])) {
    if (undelivered.versionstamp) {
      console.error('undelivered', undelivered.key, undelivered.value)
    }
  }
}

const streamToIt = (stream: ReadableStream, signal?: AbortSignal) => {
  const reader = stream.getReader()
  return {
    async *[Symbol.asyncIterator]() {
      if (signal?.aborted) {
        reader.releaseLock()
        return
      }
      signal?.addEventListener('abort', () => {
        reader.cancel()
        reader.releaseLock()
        return
      })

      try {
        while (stream.locked) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          yield value
        }
      } finally {
        reader.releaseLock()
      }
    },
  }
}
export const hasPoolables = (
  counter: Deno.KvEntryMaybe<bigint>,
  marker: Deno.KvEntryMaybe<bigint>,
  mayBeEmpty = false,
) => {
  if (!counter.versionstamp) {
    if (!mayBeEmpty) {
      throw new Error('Pool does not exist: ' + counter.key.join('/'))
    }
    return false
  }
  if (!marker.versionstamp) {
    return counter.value > 0
  }
  if (counter.value < marker.value) {
    throw new Error('invalid marker: ' + marker.key.join('/'))
  }
  return counter.value > marker.value
}
