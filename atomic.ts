import * as keys from './keys.ts'
import {
  MergeReply,
  PID,
  PierceRequest,
  Poolable,
  QueueMessage,
  SolidRequest,
} from '@/constants.ts'
import { assert, Debug, sha1 } from '@utils'
import { KEYSPACES } from '@/keys.ts'

const log = Debug('AI:db:atomic')

export class Atomic {
  // TODO handle max pool size creating too large an atomic transaction
  #kv: Deno.Kv
  #atomic: Deno.AtomicOperation | undefined
  private constructor(kv: Deno.Kv) {
    this.#kv = kv
    this.#atomic = kv.atomic()
  }
  static create(kv: Deno.Kv) {
    return new Atomic(kv)
  }
  /**
   * Used in two scenarios:
   * 1. When a pierce occurs, and adding to the pool is at the point of ulid
   *    generation, guaranteeing atomicity by way of the ulid
   * 2. During the atomic transmission process, where it is guarantee to only be
   *    added if the commit to head is successful
   * @param poolable
   * @returns
   */
  addToPool(poolable: Poolable) {
    assert(this.#atomic, 'Atomic not set')
    log('pooling start %o', poolable)
    const key = keys.getPoolKey(poolable)
    const empty = { key, versionstamp: null }
    this.#atomic = this.#atomic.check(empty).set(key, poolable)
    return key
  }
  deletePool(keys: Deno.KvKey[]) {
    assert(this.#atomic, 'Atomic not set')
    const ids = keys.map((key) => key[key.length - 1])
    log('deletePool %o', ids)
    for (const key of keys) {
      this.#atomic = this.#atomic.delete(key)
    }
  }
  async updateHead(pid: PID, fromCommit: string, toCommit: string) {
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(fromCommit), 'Commit not SHA-1: ' + fromCommit)
    assert(sha1.test(toCommit), 'Commit not SHA-1: ' + toCommit)
    const key = keys.getHeadKey(pid)
    log('updateHead %o', key)
    const from = await this.#kv.get(key)
    assert(from.value === fromCommit, 'head commit mismatch: ' + fromCommit)
    this.#atomic = this.#atomic.check(from).set(key, toCommit)
  }
  createBranch(pid: PID, commit: string) {
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    this.#atomic = this.#atomic.check({ key, versionstamp: null })
      .set(key, commit)
  }
  async deleteBranch(pid: PID, commit: string) {
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    const current = await this.#kv.get(key)
    assert(current.versionstamp, 'branch not found: ' + pid.branches.join('/'))
    assert(current.value === commit, 'branch commit mismatch')
    this.#atomic = this.#atomic.check(current)
      .delete(key)
    // TODO ensure this is tied in to the changing of the parent head
  }
  enqueuePierce(pierce: PierceRequest) {
    return this.#enqueue({ pierce })
  }
  /** Queue up a serial request for execution */
  enqueueExecution(request: SolidRequest, commit: string) {
    return this.#enqueue({ request, commit })
  }
  enqueueBranch(parentCommit: string, parentPid: PID, sequence: number) {
    return this.#enqueue({ parentCommit, parentPid, sequence })
  }
  enqueueReply(reply: MergeReply) {
    return this.#enqueue({ reply })
  }
  #enqueue(message: QueueMessage) {
    // TODO specify allowed message types as args to artifact functions
    assert(this.#atomic, 'Atomic not set')
    this.#atomic = this.#atomic.enqueue(message, {
      keysIfUndelivered: [[KEYSPACES.UNDELIVERED]],
    })
    return this
  }
  async commit() {
    assert(this.#atomic, 'Atomic not set')
    const result = await this.#atomic.commit()
    this.#atomic = undefined
    if (!result.ok) {
      return false
    }
    return true
  }
  // TODO ensure that all gets are atomic, too
}
