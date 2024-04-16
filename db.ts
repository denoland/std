import { pushable } from 'it-pushable'
import { BLOB_META_KEY, get, getMeta } from '@kitsonk/kv-toolbox/blob'
import { batchedAtomic } from '@kitsonk/kv-toolbox/batched_atomic'
import * as keys from './keys.ts'
import { freezePid, PID, Poolable, print, Splice } from '@/constants.ts'
import { assert, Debug, openKv, posix, sha1 } from '@utils'
import { Atomic } from './atomic.ts'
import { QueueMessage } from '@/constants.ts'
import { ulid } from 'ulid'

const log = Debug('AI:db')
const blog = Debug('AI:broadcast:receive')
const qlog = Debug('AI:broadcast:queue')
export default class DB {
  #kv: Deno.Kv
  #channels = new Set<BroadcastChannel>()
  #broadcastChannels = new Map<string, BroadcastChannel>()
  private constructor(kv: Deno.Kv) {
    this.#kv = kv
  }
  static async create() {
    const kv = await openKv()
    watchUndelivered(kv)
    const db = new DB(kv)
    return db
  }
  stop() {
    for (const channel of this.#channels.values()) {
      channel.close()
    }
    this.#channels.clear()
    this.#broadcastChannels.clear()
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
  /** A single use broadcast channel used to reply to queries.  Trick seems to
   * be to open it as early as possible in the isolate lifecycle to give it the
   * most reliable chance of getting its message out :shrug:
   *
   * The channel is held open to allow the transmission to get off machine. */
  getInitialChannel(name: string) {
    const channel = new BroadcastChannel(name)
    this.#channels.add(channel)
    return channel
  }
  /** Used when a new commit is formed to broadcast the diff */
  getCommitsBroadcast(pid: PID) {
    const key = keys.getChannelKey(pid)
    if (!this.#broadcastChannels.has(key)) {
      const channel = new BroadcastChannel(key)
      this.#broadcastChannels.set(key, channel)
      this.#channels.add(channel)
    }
    const channel = this.#broadcastChannels.get(key)
    assert(channel, 'Channel not found')
    return channel
  }
  getCommitsListener(pid: PID) {
    const key = keys.getChannelKey(pid)
    const channel = new BroadcastChannel(key)
    this.#channels.add(channel)
    return channel
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

    const headRequestId = ulid()
    const initialChannel = this.getInitialChannel(headRequestId)

    const head = new Promise<Splice>((resolve) => {
      initialChannel.addEventListener('message', (event): void => {
        qlog('received', print(pid), headRequestId, event.data.oid)
        resolve(event.data)
      }, { once: true })
    })

    const commitsChannel = this.getCommitsListener(pid)
    const source = pushable<Splice>({ objectMode: true })
    const commits = pushable<Splice>({ objectMode: true })
    commitsChannel.addEventListener('message', (event: MessageEvent) => {
      blog('commit', print(pid), event.data.oid)
      commits.push(event.data)
    })
    signal?.addEventListener('abort', () => {
      commitsChannel.close()
      this.#channels.delete(commitsChannel)
      commits.return()
      initialChannel.close()
      this.#channels.delete(initialChannel)
      source.return()
    })
    const pipe = async () => {
      await this.#requestHead(headRequestId, pid, path)
      const firstSplice = await head
      if (Object.keys(firstSplice.changes).length) {
        assert(path, 'Path not found in first splice')
        assert(firstSplice.changes[path], 'Path not found in first splice')
      }
      source.push(firstSplice)
      let last = firstSplice
      const pool = new Map<string, Splice>()
      for await (const splice of commits) {
        if (splice.oid === last.oid) {
          continue
        }
        let scoped = splice
        if (path && splice.changes[path]) {
          const { changes } = splice
          scoped = { ...splice, changes: { [path]: changes[path] } }
        }

        const parent = scoped.commit.parent[0]
        if (parent !== last.oid) {
          pool.set(parent, scoped)
          // TODO start an abortable process to get the missing parent
          console.log('pooled', scoped.oid, scoped.commit.parent[0])

          continue
        }
        last = scoped
        source.push(scoped)

        let noHits = true
        while (noHits && pool.size) {
          const next = pool.get(last.oid)
          if (next) {
            pool.delete(last.oid)
            last = next
            source.push(next)
          } else {
            noHits = false
          }
        }
      }
    }
    pipe().catch(source.throw)
    return source
  }
  async #requestHead(ulid: string, pid: PID, path?: string) {
    freezePid(pid)
    const result = await this.atomic()
      .enqueueHeadSplice(ulid, pid, path)
      .commit()
    assert(result, 'requestSplice failed')
    qlog('request', print(pid), ulid)
  }
}

const watchUndelivered = async (kv: Deno.Kv) => {
  for await (const [undelivered] of kv.watch([keys.UNDELIVERED])) {
    if (undelivered.versionstamp) {
      console.error('undelivered', undelivered.key, undelivered.value)
    }
  }
}
