import { pushable } from 'it-pushable'
import { BLOB_META_KEY } from '@kitsonk/kv-toolbox/blob'
import { CryptoKv, generateKey } from '@kitsonk/kv-toolbox/crypto'
import * as keys from './keys.ts'
import { freezePid } from '../processes/processes.ts'
import { assert } from '@std/assert/assert'
import Debug from 'debug'
import equal from 'fast-deep-equal'
import * as posix from '@std/path/posix'
import { Atomic } from './atomic.ts'
import { QueueMessage } from '@/constants.ts'
import { decodeTime, ulid } from 'ulid'
import FS from '@/git/fs.ts'
import IOChannel from '@io/io-channel.ts'

const log = Debug('AI:db')
export default class DB {
  #kvStore: Deno.Kv
  #cryptoKv: CryptoKv
  #abort = new AbortController()
  #aborts = new Set<AbortController>()

  private constructor(kv: Deno.Kv, aesKey: string) {
    this.#kvStore = kv
    this.#cryptoKv = new CryptoKv(kv, aesKey)
  }
  static async create(aesKey: string, seed?: Deno.KvEntry<unknown>[]) {
    const kv = await openKv()
    watchUndelivered(kv)
    const db = new DB(kv, aesKey)
    if (seed) {
      await db.load(seed)
    }
    return db
  }
  static generateAesKey() {
    return generateKey()
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
  async hasPoolables(target: PID) {
    const counterKey = keys.getPoolCounterKey(target)
    const markerKey = keys.getPoolMarkerKey(target)
    const many = [counterKey, markerKey]
    const [counter, marker] = await this.#kv.getMany<bigint[]>(many)
    return hasPoolables(counter, marker)
  }
  async getPooledActions(target: PID) {
    // TODO should pooled actions be an FS level action ?
    const prefix = keys.getPoolKeyPrefix(target)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list({ prefix }, { batchSize: 1000 })
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
      const ref = pooledRef.parse(entry.value)
      const poolable = await this.readPoolable(target, ref)
      assert(poolable, 'Invalid poolable: ' + entry.key)
      pool.push(poolable)
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
  async lockRepo(pid: PID) {
    const key = keys.getRepoLockKey(pid)
    let lockId
    do {
      lockId = ulid()
      const result = await this.#kv.atomic().check({ key, versionstamp: null })
        .set(key, lockId).commit()
      if (result.ok) {
        // TODO use keepalives to keep re-upping the key
        break
      }

      for await (const [lock] of this.#kv.watch<[string]>([key])) {
        if (!lock.versionstamp) {
          break
        }
        // TODO await the sooner of a new value or a timeout
        const time = decodeTime(lock.value)
        const remainingMs = REPO_LOCK_TIMEOUT_MS - (Date.now() - time)
        if (remainingMs <= 0) {
          const { ok } = await this.#kv.atomic().check(lock).delete(key)
            .commit()
          if (ok) {
            console.error('OVERWROTE STALE REPO LOCK: ' + print(pid))
            break
          }
        }
      }
    } while (!this.#abort.signal.aborted)
    return lockId
  }
  async releaseRepoLock(pid: PID, lockId: string) {
    const key = keys.getRepoLockKey(pid)
    const current = await this.#kv.get<string>(key)
    if (current.value === lockId) {
      const { ok } = await this.#kv.atomic().check(current).delete(key).commit()
      // TODO loop until confirmed as could error for non check reasons
      return ok
    }
    return false
  }
  async rm(pid: PID) {
    // TODO lock the repo and delete the lock last
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
    const meta = await this.#cryptoKv.getBlobMeta(key)
    return !!meta.versionstamp
  }
  async blobGet(key: Deno.KvKey) {
    const result = await this.#cryptoKv.getBlob(key)
    return result
  }
  async blobSet(key: Deno.KvKey, value: ArrayBufferLike) {
    await this.#cryptoKv.setBlob(key, value)
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

  /**
   * @param pid The branch to watch the effects lock for
   * @param abort Trigger this abort if the lock is lost
   * @returns
   */
  async watchSideEffectsLock(pid: PID, abort: AbortController) {
    // rudely snatch the lock
    // TODO ensure that releasing the lock is part of atomics
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
    if (after) {
      assert(sha1.test(after), 'Invalid after: ' + after)
      buffer.push(this.getSplice(pid, after, path))
    }
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
          continue
        }
        buffer.push(this.getSplice(pid, commit, path))
      }
    }
    pipe().catch(buffer.throw)
    const drain = async () => {
      let last: Splice | undefined
      for await (const promise of buffer) {
        const splice = await promise
        if (!last) {
          if (after) {
            assert(after === splice.oid, 'after mismatch')
          } else {
            sink.push(splice)
          }
          last = splice
          continue
        }

        const splices = [splice]
        while (splices[0].commit.parent[0] !== last.oid) {
          // TODO once piece replies are tracked directly, this can be removed
          // catch up should be the responsibility of the client, not the server
          console.error('splice race', print(splice.pid), splices.length)
          const primeParent = splices[0].commit.parent[0]
          const next = await this.getSplice(pid, primeParent, path)
          splices.unshift(next)
        }
        last = splice
        splices.map((s) => sink.push(s))
      }
    }
    drain().catch(sink.throw)
    return sink as AsyncIterable<Splice>
  }
  // TODO add aborts here, or have a master promise that is awaited
  async getSplice(pid: PID, oid: string, path?: string) {
    const fs = FS.open(pid, oid, this)
    const commit = await fs.getCommit()
    const timestamp = commit.committer.timestamp * 1000
    const splice: Splice = { pid, oid, commit, timestamp, changes: {} }
    if (path) {
      // TODO make paths be an array
      if (await fs.exists(path)) {
        const oid = await fs.readOid(path)
        const patch = await fs.read(path) // TODO check caching makes this fast
        splice.changes[path] = { oid, patch }
      }
    }
    return splice
  }

  async hasHomeAddress() {
    const home = await this.#kv.get(keys.HOME_ADDRESS)
    return !!home.versionstamp
  }
  async setHomeAddress(pid: PID) {
    const empty = { key: keys.HOME_ADDRESS, versionstamp: null }
    const result = await this.#kv.atomic().check(empty).set(
      keys.HOME_ADDRESS,
      pid,
    ).commit()
    if (!result.ok) {
      throw new Error('Home address already set')
    }
  }
  async awaitHomeAddress() {
    const home = await this.#kv.get<PID>(keys.HOME_ADDRESS)
    if (home.versionstamp) {
      return home.value
    }
    const watch = this.#kv.watch([keys.HOME_ADDRESS])
    for await (const [result] of streamToIt(watch, this.#abort.signal)) {
      if (result.versionstamp) {
        return result.value
      }
    }
    if (!this.#abort.signal.aborted) {
      throw new Error('Home address error')
    }
  }
  async lockDbProvisioning() {
    const lockId = ulid()
    const key = keys.DB_LOCK
    const result = await this.#kv.atomic().check({ key, versionstamp: null })
      .set(key, lockId)
      .commit()
    if (result.ok) {
      return lockId
    }
  }
  async unlockDbProvisioning(lockId: string) {
    const key = keys.DB_LOCK
    const entry = await this.#kv.get<string>(key)
    if (entry.value !== lockId) {
      console.error(`lock was taken from ${lockId} to ${entry.value}`)
      return
    }
    const result = await this.#kv.atomic()
      .check(entry)
      .delete(key)
      .commit()
    if (!result.ok) {
      console.error('unlockDB failed', lockId)
    }
  }
  async awaitDbProvisioning() {
    const key = keys.DB_LOCK
    const watch = this.#kv.watch([key])
    for await (const [entry] of streamToIt(watch, this.#abort.signal)) {
      if (!entry.versionstamp) {
        return
      }
    }
  }
  async drop() {
    const all = this.#kv.list({ prefix: [] }, { batchSize: 1000 })
    const promises = []
    let count = 0
    for await (const { key } of all) {
      if (!equal(key, keys.DB_LOCK)) {
        promises.push(this.#kv.delete(key))
      }
      if (promises.length % 1000 === 0) {
        count += promises.length
        await Promise.all(promises)
        promises.length = 0
        if (count > 0) {
          console.log('db drop progress:', count)
        }
      }
    }
    await Promise.all(promises)
  }
  async dump() {
    const all = this.#kv.list({ prefix: [] }, { batchSize: 1000 })
    const entries = []
    for await (const entry of all) {
      entries.push(entry)
    }
    return entries
  }
  async load(entries: Deno.KvEntry<unknown>[]) {
    let atomic = this.#kv.atomic()
    let count = 0
    for (const entry of entries) {
      count++
      // mutation limit is 1000, but there is also a size limit
      if (count % 500 === 0) {
        await atomic.commit()
        atomic = this.#kv.atomic()
      }
      atomic.set(entry.key, entry.value)
    }
    await atomic.commit()
  }
  async readPoolable(target: PID, ref: PooledRef) {
    const { commit, sequence, source, isReply } = ref
    const fs = FS.open(source, commit, this)
    const io = await IOChannel.loadWithoutPurge(fs)
    if (isReply) {
      const requestSource = target
      const outcome = io.getOutcomeBySource(requestSource, sequence)
      const reply: MergeReply = { target, sequence, outcome, source, commit }
      return reply
    } else {
      const request = io.getRequest(sequence)
      const remoteRequest: RemoteRequest = {
        ...request,
        source,
        commit,
      }
      return remoteRequest
    }
  }
}

const watchUndelivered = async (kv: Deno.Kv) => {
  for await (const [undelivered] of kv.watch([keys.UNDELIVERED])) {
    if (undelivered.versionstamp) {
      console.error('undelivered', undelivered.key, undelivered.value)
      const timestamp = new Date().toISOString()
      await kv.set([...keys.UNDELIVERED, timestamp], undelivered.value)
      await kv.delete(undelivered.key)
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
        reader.releaseLock()
        stream.cancel()
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

const isDenoDeploy = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined
let _isTestMode = false
export const isKvTestMode = () => {
  return _isTestMode
}
export const openKv = async () => {
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
  _isTestMode = path === ':memory:'
  return Deno.openKv(path)
}
