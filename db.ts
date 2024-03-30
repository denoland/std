import * as keys from './keys.ts'
import { ulid } from '$std/ulid/mod.ts'
import { PID, PierceReply, Poolable, Reply, Request } from '@/constants.ts'
import { assert, Debug, isTestMode, openKv, sha1 } from '@utils'

const EXPIRE = 5000

const log = Debug('AI:db')
export default class DB {
  #kv!: Deno.Kv
  #isTestMode!: boolean
  private constructor() {
  }
  get kv() {
    return this.#kv
  }
  get isTestMode() {
    return this.#isTestMode
  }
  static async create() {
    const db = new DB()
    db.#kv = await openKv()
    db.#isTestMode = isTestMode()
    return db
  }
  stop() {
    return this.#kv.close()
  }
  async watchReply(request: Request) {
    const key = keys.getReplyKey(request.target, request)
    log('watchReply %o', key)
    const stream = this.#kv.watch<Reply[]>([key])
    for await (const [event] of stream) {
      if (!event.versionstamp) {
        continue
      }
      const reply: Reply = event.value
      log('watchReply done %o', reply)
      return reply
    }
    // TODO remove this function completely
  }
  async settleReply(pid: PID, reply: PierceReply) {
    const key = keys.getReplyKey(pid, reply)
    log('settleReply %o', key)
    await this.#kv.set(key, reply)
  }

  async addToPool(poolable: Poolable) {
    // TODO handle IPCs too
    const key = keys.getPoolKey(poolable)
    log('pooling start %o', poolable)
    const empty = { key, versionstamp: null }
    const result = await this.#kv.atomic().check(empty).set(key, poolable)
      .commit()
    if (!result.ok) {
      log('pooling already done %o', poolable)
    } else {
      log('pooling done %o', poolable)
    }
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
        expireIn: EXPIRE,
      }).commit()
    }
    return lockId
  }
  getHeadlockMaybe(poolable: Poolable) {
    const key = keys.getHeadLockKey(poolable.target)
    log('start getHeadLock %o', key)

    const lockId = 'headlock-' + ulid()
    const poolKey = keys.getPoolKey(poolable)

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
            return
          }
          result = await this.#kv.atomic().check({ key, versionstamp: null })
            .set(key, lockId, { expireIn: EXPIRE }).commit()
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
    const lockKey = keys.getHeadLockKey(pid)
    const existing = await this.#kv.get(lockKey)
    if (existing.value !== lockId) {
      throw new Error('Mismatch: ' + lockKey.join('/') + ' ' + lockId)
    }
    const result = await this.#kv.atomic().check(existing).delete(lockKey)
      .commit()
    if (!result.ok) {
      throw new Error('Release failed: ' + lockKey.join('/') + ' ' + lockId)
    }
  }
  async getPooledActions(pid: PID) {
    const prefix = keys.getPoolKeyPrefix(pid)
    log('getPooledActions %o', prefix)
    const entries = this.#kv.list<Poolable>({ prefix })
    const poolKeys = []
    const pool: Poolable[] = []
    for await (const entry of entries) {
      if (entry.key.length !== prefix.length + 1) {
        continue
      }
      poolKeys.push(entry.key)
      pool.push(entry.value)
    }
    log('getPooledActions done %o', poolKeys.length)
    return { poolKeys, pool }
  }
  async deletePool(keys: Deno.KvKey[]) {
    const ids = keys.map((key) => key[key.length - 1])
    log('deletePool %o', ids)
    await Promise.all(keys.map((key) => this.#kv.delete(key)))
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
  async initHead(pid: PID, commit: string) {
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    log('updateHead %o', key)
    const result = await this.#kv.atomic().check({ key, versionstamp: null })
      .set(key, commit)
      .commit()
    if (!result.ok) {
      throw new Error('head already exists: ' + pid.branches.join('/'))
    }
  }
  async updateHead(pid: PID, fromCommit: string, toCommit: string) {
    assert(sha1.test(fromCommit), 'Commit not SHA-1: ' + fromCommit)
    assert(sha1.test(toCommit), 'Commit not SHA-1: ' + toCommit)
    const key = keys.getHeadKey(pid)
    log('updateHead %o', key)
    const from = await this.#kv.get(key)
    assert(from.value === fromCommit, 'head commit mismatch: ' + fromCommit)
    const result = await this.#kv.atomic().check(from).set(key, toCommit)
      .commit()
    if (!result.ok) {
      throw new Error('head update failed: ' + pid.branches.join('/'))
    }
  }
  async createBranch(pid: PID, commit: string) {
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    const result = await this.#kv.atomic().check({ key, versionstamp: null })
      .set(key, commit).commit()
    if (!result.ok) {
      throw new Error('branch already exists: ' + pid.branches.join('/'))
    }
  }
  async deleteBranch(pid: PID, commit: string) {
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    const current = await this.#kv.get(key)
    assert(current.versionstamp, 'branch not found: ' + pid.branches.join('/'))
    assert(current.value === commit, 'branch commit mismatch')
    const result = await this.#kv.atomic().check(current)
      .delete(key).commit()
    if (!result.ok) {
      throw new Error('branch deletion error: ' + pid.branches.join('/'))
    }
    // TODO should this also be tied in to the changing of the head of the
    // parent at the same time ?  This would ensure the merge had occured.
  }
  async rm(pid: PID) {
    const prefixes = keys.getPrefixes(pid)
    log('rm %o', prefixes)
    const promises = []
    for (const prefix of prefixes) {
      const all = this.#kv.list({ prefix })
      const wipe = async () => {
        const deletes = []
        for await (const { key } of all) {
          log('deleted: ', key)
          deletes.push(this.#kv.delete(key))
        }
        await Promise.all(deletes)
      }
      promises.push(wipe())
    }
    await Promise.all(promises)
  }
  watchHead(pid: PID, signal: AbortSignal) {
    const key = keys.getHeadKey(pid)
    const stream = this.#kv.watch<string[]>([key])
    return stream.pipeThrough(
      new TransformStream({
        start(controller) {
          signal.addEventListener('abort', () => {
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
}
