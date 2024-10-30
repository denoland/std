import * as keys from './keys.ts'
import { hasPoolables } from './db.ts'
import {
  isMergeReply,
  PID,
  Poolable,
  PooledRef,
  QueueMessage,
  QueueMessageType,
  sha1,
} from '@/constants.ts'
import { assert } from '@std/assert'
import Debug from 'debug'
import { isKvTestMode } from './utils.ts'

const log = Debug('AI:db:atomic')

export class Atomic {
  // TODO handle max pool size creating too large an atomic transaction
  #kv: Deno.Kv
  #atomic: Deno.AtomicOperation | undefined
  #transmitted = new Map<string, { pid: PID; count: bigint }>()
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
   * 2. During the atomic transmission process, where it is guaranteed to only
   *    be added if the commit to head is successful
   * @param poolable
   * @returns
   */
  addToPool(poolable: Poolable) {
    assert(this.#atomic, 'Atomic not set')
    log('pooling start %o', poolable)
    const key = keys.getPoolKey(poolable)
    const empty = { key, versionstamp: null }
    const { commit, sequence, source } = poolable
    const isReply = isMergeReply(poolable)

    const ref: PooledRef = { commit, sequence, source, isReply }
    this.#atomic = this.#atomic.check(empty).set(key, ref)

    const poolKey = JSON.stringify(keys.getPoolKeyPrefix(poolable.target))
    if (!this.#transmitted.has(poolKey)) {
      this.#transmitted.set(poolKey, {
        pid: poolable.target,
        count: BigInt(0),
      })
    }
    const buffer = this.#transmitted.get(poolKey)
    assert(buffer)
    buffer.count++
    return this
  }
  deletePool(pid: PID, poolKeys: Deno.KvKey[]) {
    assert(this.#atomic, 'Atomic not set')
    log('deletePool %o', poolKeys.map((key) => key[key.length - 1]))
    for (const key of poolKeys) {
      this.#atomic = this.#atomic.delete(key)
    }
    const markerKey = keys.getPoolMarkerKey(pid)
    this.#atomic = this.#atomic.sum(markerKey, BigInt(poolKeys.length))
    return this
  }
  async updateHead(pid: PID, fromCommit: string, toCommit: string) {
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(fromCommit), 'Commit not SHA-1: ' + fromCommit)
    assert(sha1.test(toCommit), 'Commit not SHA-1: ' + toCommit)
    assert(fromCommit !== toCommit, 'Commits are the same')
    const key = keys.getHeadKey(pid)
    log('updateHead %o', key, fromCommit, toCommit)
    const from = await this.#kv.get(key)
    if (from.value !== fromCommit) {
      return false
    }
    this.#atomic = this.#atomic.check(from).set(key, toCommit)
    return this
  }
  createBranch(pid: PID, commit: string) {
    // TODO check the pid is based on this pid
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    this.#atomic = this.#atomic.check({ key, versionstamp: null })
      .set(key, commit)
    return this
  }
  /**
   * @param pid the branch to delete
   * @param commit the current branch commit that is being deleted, which is
   * used to provide safety in case something else has changed the branch
   */
  async deleteBranch(pid: PID, commit: string) {
    assert(this.#atomic, 'Atomic not set')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    const key = keys.getHeadKey(pid)
    const current = await this.#kv.get(key)
    if (!current.versionstamp || current.value !== commit) {
      return false
    }
    this.#atomic = this.#atomic.check(current).delete(key)
    return this
    // TODO ensure this is tied in to the changing of the parent head
  }
  /** Queue up a serial request for execution
   * @param commit the commit to provide to the execution environment when the
   * request is run
   */
  enqueueExecution(pid: PID, sequence: number, commit: string) {
    const type = QueueMessageType.EXECUTION
    return this.#enqueue({ type, pid, sequence, commit })
  }
  enqueueBranch(parentCommit: string, parentPid: PID, sequence: number) {
    const type = QueueMessageType.BRANCH
    return this.#enqueue({ type, parentCommit, parentPid, sequence })
  }
  #enqueuePool(pid: PID) {
    const type = QueueMessageType.POOL
    return this.#enqueue({ type, pid })
  }
  #enqueue(message: QueueMessage) {
    assert(this.#atomic, 'Atomic not set')
    const options: {
      keysIfUndelivered: Deno.KvKey[]
      backoffSchedule?: number[]
    } = { keysIfUndelivered: [keys.UNDELIVERED] }
    if (isKvTestMode()) {
      options.backoffSchedule = []
    }
    this.#atomic = this.#atomic.enqueue(message, options)
    return this
  }
  #increasePool(pid: PID, amount: bigint) {
    assert(this.#atomic, 'Atomic not set')
    const counterKey = keys.getPoolCounterKey(pid)
    this.#atomic = this.#atomic.sum(counterKey, amount)
    return this
  }
  #checkMarker(marker: Deno.KvEntryMaybe<bigint>) {
    assert(this.#atomic, 'Atomic not set')
    this.#atomic = this.#atomic.check(marker)
    return this
  }
  async commit() {
    // TODO go thru all atomic usage and ensure all async ops are at the end
    assert(this.#atomic, 'Atomic not set')

    const markerCounterKeys = []
    const transmissions = [...this.#transmitted.values()]
    for (const { pid, count } of transmissions) {
      markerCounterKeys.push(keys.getPoolMarkerKey(pid))
      const counterKey = keys.getPoolCounterKey(pid)
      markerCounterKeys.push(counterKey)
      this.#increasePool(pid, count)
    }
    const markerCounters = await this.#kv.getMany<bigint[]>(markerCounterKeys)
    for (let i = 0; i < markerCounters.length; i += 2) {
      const marker = markerCounters[i]
      const counter = markerCounters[i + 1]

      this.#checkMarker(marker)
      const mayBeEmpty = true
      if (!hasPoolables(counter, marker, mayBeEmpty)) {
        // if one was processed, all were processed ☢️
        this.#enqueuePool(transmissions[i].pid)
      }
    }
    const atomic = this.#atomic
    this.#atomic = undefined
    const result = await atomic.commit()
    if (!result.ok) {
      return false
    }
    return true
  }
}
