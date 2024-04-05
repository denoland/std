import { get, set } from '$kv_toolbox'
import * as keys from './keys.ts'
import { PID, Poolable } from '@/constants.ts'
import { assert, Debug, openKv, sha1 } from '@utils'
import { Atomic } from './atomic.ts'
import { QueueMessage } from '@/constants.ts'

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
    // TODO get maintenance lock on the repo first, and quiesce activity
    const prefixes = keys.getPrefixes(pid)
    log('rm %o', prefixes)
    const wipe = async (prefix: Deno.KvKey) => {
      const all = this.#kv.list({ prefix })
      const deletes = []
      for await (const { key } of all) {
        log('deleted: ', key)
        deletes.push(this.#kv.delete(key))
      }
      await Promise.all(deletes)
    }
    const promises = prefixes.map(wipe)
    await Promise.all(promises)
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
    const start = Date.now()
    const result = await this.#kv.get([...key, '__kv_toolbox_meta__'])
    console.log(' Exists', key.join('/'), Date.now() - start, 'ms')
    return !!result.versionstamp
  }
  async blobGet(key: Deno.KvKey) {
    const start = Date.now()
    const result = await get(this.#kv, key)
    console.log('blobGet', key.join('/'), Date.now() - start, 'ms')
    return result
  }
  async blobSet(key: Deno.KvKey, value: ArrayBufferLike) {
    // this is atomic, thanks to kv_toolbox batched atomic operations
    const start = Date.now()
    const result = await set(this.#kv, key, value)
    console.log('####Set', key.join('/'), Date.now() - start, 'ms')
    return result
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
        if (end[1] === '__kv_toolbox_meta__') {
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
}

// Test the db with the real KV opened up
