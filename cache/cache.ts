// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
import type { MemoizationCache } from "./memoize.ts";

/**
 * The reason an entry was removed from the cache.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * - `"evicted"` — removed because the cache exceeded
 *   {@linkcode Cache.prototype.maxSize | maxSize}.
 * - `"expired"` — removed because its TTL elapsed.
 * - `"deleted"` — removed by an explicit
 *   {@linkcode Cache.prototype.delete | delete()} call.
 * - `"cleared"` — removed by
 *   {@linkcode Cache.prototype.clear | clear()}.
 */
export type CacheRemovalReason = "evicted" | "expired" | "deleted" | "cleared";

/**
 * Options shared by all {@linkcode Cache} configurations.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 */
export interface CacheOptionsBase<K, V> {
  /**
   * Maximum number of entries. When exceeded, the least-recently-used entry
   * is evicted. Omit for unbounded.
   */
  maxSize?: number;
  /**
   * Called when an entry is removed by eviction, expiration, deletion, or
   * clearing. Not called when {@linkcode Cache.prototype.set | set()}
   * overwrites an existing key. The entry is already removed when this
   * fires. The cache is not re-entrant during this callback: calling
   * `set`, `delete`, or `clear` will throw.
   *
   * @param key The key of the removed entry.
   * @param value The value of the removed entry.
   * @param reason Why the entry was removed.
   */
  onRemove?: (key: K, value: V, reason: CacheRemovalReason) => void;

  /** Must be `undefined` for non-TTL caches. */
  ttl?: undefined;
  /** Must be `undefined` for non-TTL caches. */
  slidingExpiration?: undefined;
  /** Must be `undefined` for non-SWR caches. */
  staleTtl?: undefined;
  /** Must be `undefined` for non-SWR caches. */
  refresh?: undefined;
  /** Must be `undefined` for non-SWR caches. */
  onRefreshError?: undefined;
}

/**
 * {@linkcode Cache} options that enable TTL expiration.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 */
export interface CacheOptionsTtl<K, V> {
  /**
   * Maximum number of entries. When exceeded, the least-recently-used entry
   * is evicted. Omit for unbounded.
   */
  maxSize?: number;
  /**
   * Called when an entry is removed by eviction, expiration, deletion, or
   * clearing. Not called when {@linkcode Cache.prototype.set | set()}
   * overwrites an existing key. The entry is already removed when this
   * fires. The cache is not re-entrant during this callback: calling
   * `set`, `delete`, or `clear` will throw.
   *
   * @param key The key of the removed entry.
   * @param value The value of the removed entry.
   * @param reason Why the entry was removed.
   */
  onRemove?: (key: K, value: V, reason: CacheRemovalReason) => void;
  /**
   * Default time-to-live in milliseconds. Entries expire after this
   * duration.
   */
  ttl: number;
  /**
   * When `true`, {@linkcode Cache.prototype.get | get()} resets the
   * entry's TTL. {@linkcode Cache.prototype.peek | peek()} and
   * {@linkcode Cache.prototype.has | has()} do not.
   *
   * @default {false}
   */
  slidingExpiration?: boolean;

  /** Must be `undefined` for non-SWR caches. */
  staleTtl?: undefined;
  /** Must be `undefined` for non-SWR caches. */
  refresh?: undefined;
  /** Must be `undefined` for non-SWR caches. */
  onRefreshError?: undefined;
}

/**
 * {@linkcode Cache} options that enable stale-while-revalidate.
 *
 * After {@linkcode CacheOptionsSwr.staleTtl | staleTtl} elapses, the entry
 * is "stale": still returned by {@linkcode Cache.prototype.get | get()},
 * but a background call to
 * {@linkcode CacheOptionsSwr.refresh | refresh()} is triggered to replace
 * it. The entry is fully expired after
 * {@linkcode CacheOptionsSwr.ttl | ttl}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 */
export interface CacheOptionsSwr<K, V> {
  /**
   * Maximum number of entries. When exceeded, the least-recently-used entry
   * is evicted. Omit for unbounded.
   */
  maxSize?: number;
  /**
   * Called when an entry is removed by eviction, expiration, deletion, or
   * clearing. Not called when {@linkcode Cache.prototype.set | set()}
   * overwrites an existing key. The entry is already removed when this
   * fires. The cache is not re-entrant during this callback: calling
   * `set`, `delete`, or `clear` will throw.
   *
   * @param key The key of the removed entry.
   * @param value The value of the removed entry.
   * @param reason Why the entry was removed.
   */
  onRemove?: (key: K, value: V, reason: CacheRemovalReason) => void;
  /**
   * Default time-to-live in milliseconds. Entries expire after this
   * duration. Must be greater than
   * {@linkcode CacheOptionsSwr.staleTtl | staleTtl}.
   */
  ttl: number;
  /**
   * When `true`, {@linkcode Cache.prototype.get | get()} resets the
   * entry's hard TTL deadline. {@linkcode Cache.prototype.peek | peek()}
   * and {@linkcode Cache.prototype.has | has()} do not. Only the hard
   * deadline ({@linkcode CacheOptionsSwr.ttl | ttl}) is extended; the
   * stale deadline ({@linkcode CacheOptionsSwr.staleTtl | staleTtl}) is
   * not reset, so background refreshes are still triggered based on the
   * original creation time.
   *
   * @default {false}
   */
  slidingExpiration?: boolean;
  /**
   * Soft TTL in milliseconds. After this duration the entry is "stale" —
   * still returned by {@linkcode Cache.prototype.get | get()}, but a
   * background {@linkcode CacheOptionsSwr.refresh | refresh()} is
   * triggered. Must be less than {@linkcode CacheOptionsSwr.ttl | ttl}.
   */
  staleTtl: number;
  /**
   * Called to refresh a stale entry. The returned value replaces the entry
   * and resets both soft and hard deadlines. If
   * {@linkcode Cache.prototype.set | set()} or
   * {@linkcode Cache.prototype.delete | delete()} is called on the same
   * key while a refresh is in flight, the refresh result is discarded.
   *
   * @param key The key of the stale entry.
   * @param staleValue The current stale value.
   * @returns A promise resolving to the fresh value.
   */
  refresh: (key: K, staleValue: V) => Promise<V>;
  /**
   * Called when a background refresh fails. The stale value is retained
   * until the hard TTL expires. When not provided, refresh errors are
   * silently discarded and only reflected in
   * {@linkcode CacheStats.refreshErrors | stats.refreshErrors}.
   *
   * @param key The key of the entry whose refresh failed.
   * @param error The error thrown by
   *   {@linkcode CacheOptionsSwr.refresh | refresh()}.
   */
  onRefreshError?: (key: K, error: unknown) => void;
}

/**
 * Valid option shapes for the {@linkcode Cache} constructor. The union
 * enforces that TTL-related options cannot be set without `ttl`, and
 * SWR options cannot be set without both `staleTtl` and `refresh`:
 *
 * ```ts ignore
 * new Cache({ slidingExpiration: true }); // compile error
 * new Cache({ ttl: 5000, staleTtl: 3000 }); // compile error
 * new Cache({ ttl: 5000, refresh: fn }); // compile error
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 */
export type CacheOptions<K, V> =
  | CacheOptionsBase<K, V>
  | CacheOptionsTtl<K, V>
  | CacheOptionsSwr<K, V>;

/**
 * Per-entry overrides for {@linkcode Cache.prototype.set | set()}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CacheSetOptions {
  /**
   * Override the default TTL for this entry. When set on a cache that was
   * constructed without a default `ttl`, this entry will still expire
   * after the given duration. Must be a finite non-negative number.
   */
  ttl?: number;
  /**
   * Absolute expiration cap in milliseconds, measured from the time of the
   * `set()` call. The entry will expire no later than this duration after
   * it was set, regardless of TTL or sliding resets. When
   * {@linkcode CacheOptionsTtl.slidingExpiration | slidingExpiration} is
   * enabled, the sliding window cannot extend past this cap. Without
   * `slidingExpiration`, `absoluteExpiration` still clamps the initial
   * deadline if it is shorter than the entry's TTL. Must be a finite
   * non-negative number.
   */
  absoluteExpiration?: number;
  /**
   * Override the default
   * {@linkcode CacheOptionsSwr.staleTtl | staleTtl} for this entry.
   * Ignored when the cache was not constructed with
   * {@linkcode CacheOptionsSwr.refresh | refresh}. Must be a finite
   * non-negative number.
   */
  staleTtl?: number;
}

/**
 * Cache performance counters returned by
 * {@linkcode Cache.prototype.stats | stats}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CacheStats {
  /** Number of {@linkcode Cache.prototype.get | get()} calls that found a
   * live entry. */
  hits: number;
  /** Number of {@linkcode Cache.prototype.get | get()} calls that did not
   * find a live entry. */
  misses: number;
  /** Number of {@linkcode Cache.prototype.set | set()} calls. */
  sets: number;
  /** Number of {@linkcode Cache.prototype.delete | delete()} calls that
   * removed an entry. */
  deletes: number;
  /** Number of entries removed by LRU eviction. */
  evictions: number;
  /** Number of entries removed by TTL expiration. */
  expirations: number;
  /** Number of {@linkcode Cache.prototype.get | get()} calls that
   * returned a stale value and triggered a background refresh. */
  staleHits: number;
  /** Number of background refreshes started. */
  refreshes: number;
  /** Number of background refreshes that failed. */
  refreshErrors: number;
}

interface CacheEntry<K, V> {
  key: K;
  value: V;
  prev: CacheEntry<K, V> | undefined;
  next: CacheEntry<K, V> | undefined;
  deadline: number;
  absoluteDeadline: number;
  entryTtl: number;
  softDeadline: number;
  entryStaleTtl: number;
  generation: number;
}

/**
 * A size-bounded, time-bounded in-memory cache with LRU eviction and
 * optional TTL expiration.
 *
 * Mode is determined by which options are provided:
 *
 * | Configuration | Behaviour |
 * | --- | --- |
 * | `{ maxSize }` | Pure LRU, no timers |
 * | `{ ttl }` | Pure TTL, unbounded |
 * | `{ maxSize, ttl }` | LRU + TTL |
 * | `{ ttl, staleTtl, refresh }` | Stale-while-revalidate |
 * | `{ maxSize, ttl, staleTtl, refresh }` | LRU + SWR |
 * | `{}` or no options | Unbounded, no expiry |
 *
 * The cache does **not** extend `Map`. It owns a `Map` internally and
 * delegates to {@linkcode IndexedHeap} from `@std/data-structures` for
 * deadline scheduling with a single `setTimeout`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 *
 * @example Pure LRU
 * ```ts
 * import { Cache } from "@std/cache/cache";
 * import { assertEquals } from "@std/assert";
 *
 * const cache = new Cache<string, number>({ maxSize: 3 });
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);
 * cache.set("d", 4);
 *
 * assertEquals(cache.has("a"), false);
 * assertEquals(cache.get("d"), 4);
 * ```
 *
 * @example LRU + TTL
 * ```ts
 * import { Cache } from "@std/cache/cache";
 * import { assertEquals } from "@std/assert";
 * import { FakeTime } from "@std/testing/time";
 *
 * using time = new FakeTime(0);
 * using cache = new Cache<string, number>({ maxSize: 100, ttl: 1000 });
 *
 * cache.set("a", 1);
 * assertEquals(cache.get("a"), 1);
 *
 * time.tick(1001);
 * assertEquals(cache.get("a"), undefined);
 * ```
 */
export class Cache<K, V> implements MemoizationCache<K, V> {
  #data = new Map<K, CacheEntry<K, V>>();
  #maxSize: number | undefined;
  #defaultTtl: number;
  #slidingExpiration: boolean;
  #removingDepth = 0;
  #onRemove:
    | ((key: K, value: V, reason: CacheRemovalReason) => void)
    | undefined;

  #head: CacheEntry<K, V> | undefined;
  #tail: CacheEntry<K, V> | undefined;
  #heap: IndexedHeap<K> | undefined;
  #timerId: number | undefined;
  #scheduledDeadline: number | undefined;
  #inFlight: Map<K, Promise<V>> | undefined;

  #defaultStaleTtl: number;
  #refresh: ((key: K, staleValue: V) => Promise<V>) | undefined;
  #onRefreshError: ((key: K, error: unknown) => void) | undefined;
  #refreshing: Set<K> | undefined;
  #generation = 0;

  #stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    expirations: 0,
    staleHits: 0,
    refreshes: 0,
    refreshErrors: 0,
  };

  /**
   * Constructs a new `Cache`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param options Configuration options.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   * ```
   */
  constructor(options?: CacheOptions<K, V>) {
    if (options?.maxSize !== undefined) {
      if (!Number.isInteger(options.maxSize) || options.maxSize < 1) {
        throw new RangeError(
          `Cannot create Cache: maxSize must be a positive integer, received ${options.maxSize}`,
        );
      }
      this.#maxSize = options.maxSize;
    }

    const ttl = options?.ttl;
    if (ttl !== undefined) {
      if (!(ttl >= 0) || !Number.isFinite(ttl)) {
        throw new RangeError(
          `Cannot create Cache: ttl must be a finite non-negative number, received ${ttl}`,
        );
      }
      this.#defaultTtl = ttl;
      this.#heap = new IndexedHeap<K>();
    } else {
      this.#defaultTtl = Infinity;
    }

    this.#slidingExpiration = options?.slidingExpiration ?? false;
    this.#onRemove = options?.onRemove;

    if (options?.staleTtl !== undefined) {
      const { staleTtl } = options;
      if (!(staleTtl >= 0) || !Number.isFinite(staleTtl)) {
        throw new RangeError(
          `Cannot create Cache: staleTtl must be a finite non-negative number, received ${staleTtl}`,
        );
      }
      if (staleTtl >= this.#defaultTtl) {
        throw new RangeError(
          `Cannot create Cache: staleTtl must be less than ttl, received staleTtl=${staleTtl} ttl=${this.#defaultTtl}`,
        );
      }
      this.#defaultStaleTtl = staleTtl;
      this.#refresh = options.refresh;
      this.#onRefreshError = options.onRefreshError;
    } else {
      this.#defaultStaleTtl = Infinity;
    }
  }

  /**
   * The maximum number of entries, or `undefined` if unbounded.
   *
   * @returns The maximum number of entries, or `undefined`.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * assertEquals(cache.maxSize, 100);
   * ```
   */
  get maxSize(): number | undefined {
    return this.#maxSize;
  }

  /**
   * The number of entries currently in the cache. This count may include
   * expired entries that have not yet been lazily removed. Use the
   * iterators ({@linkcode Cache.prototype.keys},
   * {@linkcode Cache.prototype.values}, {@linkcode Cache.prototype.entries})
   * if an accurate live-entry count is needed.
   *
   * @returns The number of entries.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assertEquals(cache.size, 1);
   * ```
   */
  get size(): number {
    return this.#data.size;
  }

  /**
   * Performance counters. The returned object is a snapshot copy;
   * mutations have no effect on the cache.
   *
   * @returns A snapshot of the cache's performance counters.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.get("a");
   * cache.get("b");
   * assertEquals(cache.stats.hits, 1);
   * assertEquals(cache.stats.misses, 1);
   * ```
   */
  get stats(): Readonly<CacheStats> {
    return { ...this.#stats };
  }

  /**
   * Reset all performance counters to zero.
   *
   * @returns {void}
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.get("a");
   * cache.resetStats();
   * assertEquals(cache.stats.hits, 0);
   * ```
   */
  resetStats(): void {
    this.#stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0,
      staleHits: 0,
      refreshes: 0,
      refreshErrors: 0,
    };
  }

  #isExpired(entry: CacheEntry<K, V>, now: number): boolean {
    return entry.deadline !== Infinity && entry.deadline <= now;
  }

  #removeEntry(
    key: K,
    entry: CacheEntry<K, V>,
    reason: CacheRemovalReason,
  ): void {
    this.#data.delete(key);
    this.#unlink(entry);
    this.#heap?.delete(key);
    if (this.#onRemove) {
      this.#removingDepth++;
      try {
        this.#onRemove(key, entry.value, reason);
      } finally {
        this.#removingDepth--;
      }
    }
  }

  #assertNotRemoving(method: string): void {
    if (this.#removingDepth > 0) {
      throw new TypeError(
        `Cannot ${method} Cache: cache is not re-entrant during onRemove callbacks`,
      );
    }
  }

  #unlink(node: CacheEntry<K, V>): void {
    if (node.prev !== undefined) node.prev.next = node.next;
    else this.#head = node.next;
    if (node.next !== undefined) node.next.prev = node.prev;
    else this.#tail = node.prev;
    node.prev = undefined;
    node.next = undefined;
  }

  #linkToTail(node: CacheEntry<K, V>): void {
    node.prev = this.#tail;
    node.next = undefined;
    if (this.#tail !== undefined) this.#tail.next = node;
    else this.#head = node;
    this.#tail = node;
  }

  #promoteToMru(node: CacheEntry<K, V>): void {
    if (node === this.#tail) return;
    this.#unlink(node);
    this.#linkToTail(node);
  }

  #pruneToMaxSize(): void {
    if (this.#maxSize === undefined || this.#data.size <= this.#maxSize) return;
    const lru = this.#head!;
    this.#stats.evictions++;
    this.#removeEntry(lru.key, lru, "evicted");
  }

  #scheduleTimer(): void {
    const nextDeadline = this.#heap?.peekPriority();
    if (nextDeadline === undefined) return;
    if (nextDeadline === this.#scheduledDeadline) return;
    if (this.#timerId !== undefined) clearTimeout(this.#timerId);
    this.#scheduledDeadline = nextDeadline;
    const delay = Math.min(Math.max(0, nextDeadline - Date.now()), 0x7FFFFFFF);
    this.#timerId = setTimeout(() => this.#onTimer(), delay);
  }

  #onTimer(): void {
    this.#timerId = undefined;
    this.#scheduledDeadline = undefined;
    const now = Date.now();
    const heap = this.#heap!;
    const errors: unknown[] = [];
    while (!heap.isEmpty()) {
      if (heap.peekPriority()! > now) break;
      const top = heap.pop()!;
      const entry = this.#data.get(top.key)!;
      this.#data.delete(top.key);
      this.#unlink(entry);
      this.#stats.expirations++;
      if (!this.#onRemove) continue;
      this.#removingDepth++;
      try {
        this.#onRemove(top.key, entry.value, "expired");
      } catch (e) {
        errors.push(e);
      } finally {
        this.#removingDepth--;
      }
    }
    this.#scheduleTimer();
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors);
  }

  #setHeapDeadline(key: K, deadline: number): void {
    const heap = this.#heap ?? (this.#heap = new IndexedHeap<K>());
    const wasRoot = heap.isEmpty() || heap.peekKey() === key;
    heap.pushOrUpdate(key, deadline);
    const isRoot = heap.peekKey() === key;
    if (wasRoot || isRoot) {
      this.#scheduleTimer();
    }
  }

  #updateDeadline(
    key: K,
    entry: CacheEntry<K, V>,
    ttl: number,
    now: number,
  ): void {
    let effectiveTtl = ttl;
    if (this.#slidingExpiration && entry.absoluteDeadline !== Infinity) {
      effectiveTtl = Math.min(ttl, Math.max(0, entry.absoluteDeadline - now));
    }
    const deadline = now + effectiveTtl;
    entry.deadline = deadline;
    this.#setHeapDeadline(key, deadline);
  }

  #touch(key: K, entry: CacheEntry<K, V>, now: number): V {
    if (
      this.#refresh !== undefined &&
      entry.softDeadline !== Infinity &&
      entry.softDeadline <= now &&
      !this.#refreshing?.has(key)
    ) {
      this.#stats.staleHits++;
      this.#backgroundRefresh(key, entry.value);
    } else {
      this.#stats.hits++;
    }
    if (this.#slidingExpiration && entry.deadline !== Infinity) {
      this.#updateDeadline(key, entry, entry.entryTtl, now);
    }
    this.#promoteToMru(entry);
    return entry.value;
  }

  #backgroundRefresh(key: K, staleValue: V): void {
    (this.#refreshing ??= new Set()).add(key);
    this.#stats.refreshes++;
    const entry = this.#data.get(key)!;
    const gen = entry.generation;
    const entryTtl = entry.entryTtl;
    const entryStaleTtl = entry.entryStaleTtl;
    const absDeadline = entry.absoluteDeadline;
    let refreshResult: Promise<V>;
    try {
      refreshResult = this.#refresh!(key, staleValue);
    } catch (error) {
      this.#refreshing?.delete(key);
      this.#stats.refreshErrors++;
      try {
        this.#onRefreshError?.(key, error);
      } catch { /* contained */ }
      return;
    }
    refreshResult.then(
      (newValue) => {
        this.#refreshing?.delete(key);
        const current = this.#data.get(key);
        if (current !== undefined && current.generation === gen) {
          const options: CacheSetOptions = {};
          if (entryTtl !== this.#defaultTtl) options.ttl = entryTtl;
          if (entryStaleTtl !== this.#defaultStaleTtl) {
            options.staleTtl = entryStaleTtl;
          }
          if (absDeadline !== Infinity) {
            options.absoluteExpiration = Math.max(0, absDeadline - Date.now());
          }
          this.set(key, newValue, options);
        }
      },
      (error) => {
        this.#refreshing?.delete(key);
        this.#stats.refreshErrors++;
        try {
          this.#onRefreshError?.(key, error);
        } catch { /* contained */ }
      },
    );
  }

  /**
   * Returns the value associated with the given key, or `undefined` if the
   * key is not present or has expired. Promotes the entry to
   * most-recently-used. When
   * {@linkcode CacheOptionsTtl.slidingExpiration | slidingExpiration} is
   * enabled, resets the entry's TTL.
   *
   * @param key The key to look up.
   * @returns The value, or `undefined` if not present or expired.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   * assertEquals(cache.get("b"), undefined);
   * ```
   */
  get(key: K): V | undefined {
    const entry = this.#data.get(key);
    if (entry === undefined) {
      this.#stats.misses++;
      return undefined;
    }
    const now = Date.now();
    if (this.#isExpired(entry, now)) {
      this.#stats.expirations++;
      this.#removeEntry(key, entry, "expired");
      this.#stats.misses++;
      return undefined;
    }
    return this.#touch(key, entry, now);
  }

  /**
   * Returns the value associated with the given key, or `undefined` if the
   * key is not present, **without** promoting it in the eviction order or
   * resetting its TTL.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up.
   * @returns The value, or `undefined` if not present or expired.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 3 });
   * cache.set("a", 1);
   * cache.set("b", 2);
   * cache.set("c", 3);
   *
   * assertEquals(cache.peek("a"), 1);
   * cache.set("d", 4);
   * assertEquals(cache.peek("a"), undefined);
   * ```
   */
  peek(key: K): V | undefined {
    const entry = this.#data.get(key);
    if (entry === undefined) return undefined;
    if (entry.deadline !== Infinity && entry.deadline <= Date.now()) {
      if (this.#removingDepth === 0) {
        this.#stats.expirations++;
        this.#removeEntry(key, entry, "expired");
      }
      return undefined;
    }
    return entry.value;
  }

  /**
   * Checks whether a live (non-expired) entry exists for the given key.
   * Does **not** promote the entry or reset its TTL.
   *
   * @param key The key to check.
   * @returns `true` if a live entry exists, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assert } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assert(cache.has("a"));
   * assert(!cache.has("b"));
   * ```
   */
  has(key: K): boolean {
    const entry = this.#data.get(key);
    if (entry === undefined) return false;
    if (entry.deadline !== Infinity && entry.deadline <= Date.now()) {
      if (this.#removingDepth === 0) {
        this.#stats.expirations++;
        this.#removeEntry(key, entry, "expired");
      }
      return false;
    }
    return true;
  }

  /**
   * Inserts or overwrites an entry. Promotes the key to most-recently-used.
   * If the cache exceeds {@linkcode Cache.prototype.maxSize | maxSize},
   * the least-recently-used entry is evicted. Overwriting an existing key
   * does **not** fire {@linkcode CacheOptionsBase.onRemove | onRemove}.
   *
   * @param key The key to set.
   * @param value The value to set.
   * @param options Per-entry overrides.
   * @returns `this` for chaining.
   *
   * @example Usage
   * ```ts no-assert
   * import { Cache } from "@std/cache/cache";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * ```
   */
  set(key: K, value: V, options?: CacheSetOptions): this {
    this.#assertNotRemoving("set entry in");
    const ttl = options?.ttl ?? this.#defaultTtl;
    if (options?.ttl !== undefined && (!(ttl >= 0) || !Number.isFinite(ttl))) {
      throw new RangeError(
        `Cannot set entry in Cache: ttl must be a finite non-negative number, received ${ttl}`,
      );
    }
    const abs = options?.absoluteExpiration;
    if (abs !== undefined && (!(abs >= 0) || !Number.isFinite(abs))) {
      throw new RangeError(
        `Cannot set entry in Cache: absoluteExpiration must be a finite non-negative number, received ${abs}`,
      );
    }
    if (
      options?.staleTtl !== undefined &&
      (!(options.staleTtl >= 0) || !Number.isFinite(options.staleTtl))
    ) {
      throw new RangeError(
        `Cannot set entry in Cache: staleTtl must be a finite non-negative number, received ${options.staleTtl}`,
      );
    }
    const staleTtl = options?.staleTtl ?? this.#defaultStaleTtl;
    if (staleTtl !== Infinity && staleTtl >= ttl) {
      throw new RangeError(
        `Cannot set entry in Cache: staleTtl must be less than ttl, received staleTtl=${staleTtl} ttl=${ttl}`,
      );
    }

    const now = Date.now();
    const absoluteDeadline = abs !== undefined ? now + abs : Infinity;
    const deadline = Math.min(
      ttl === Infinity ? Infinity : now + ttl,
      absoluteDeadline,
    );
    const softDeadline = staleTtl === Infinity
      ? Infinity
      : Math.min(now + staleTtl, deadline);

    const entry: CacheEntry<K, V> = {
      key,
      value,
      prev: undefined,
      next: undefined,
      deadline,
      absoluteDeadline,
      entryTtl: ttl,
      softDeadline,
      entryStaleTtl: staleTtl,
      generation: ++this.#generation,
    };

    const old = this.#data.get(key);
    if (old !== undefined) this.#unlink(old);
    this.#linkToTail(entry);
    this.#data.set(key, entry);
    this.#inFlight?.delete(key);
    this.#refreshing?.delete(key);

    if (deadline !== Infinity) {
      this.#setHeapDeadline(key, deadline);
    } else {
      this.#heap?.delete(key);
    }

    this.#stats.sets++;
    this.#pruneToMaxSize();
    return this;
  }

  /**
   * Returns the cached value for the given key if present. Otherwise, calls
   * `loader` to produce the value, caches it, and returns it. Concurrent
   * calls with the same key while a loader is in flight are de-duplicated:
   * only one `loader` invocation occurs, and all callers receive the same
   * promise. If {@linkcode Cache.prototype.set | set()},
   * {@linkcode Cache.prototype.delete | delete()}, or
   * {@linkcode Cache.prototype.clear | clear()} is called on the same key
   * while a loader is in flight, the loader result is discarded.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up or load.
   * @param loader Called when the key is not in the cache. Receives the key
   *   and must return a promise resolving to the value.
   * @param options Per-entry overrides applied when the loaded value is
   *   cached. Ignored on cache hits. When concurrent callers de-duplicate,
   *   only the first caller's `options` are used.
   * @returns A promise resolving to the cached or freshly loaded value.
   *
   * @example Basic load-through
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * const value = await cache.getOrLoad("a", () => Promise.resolve(42));
   * assertEquals(value, 42);
   * assertEquals(cache.get("a"), 42);
   * ```
   *
   * @example Concurrent callers are de-duplicated
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * let loadCount = 0;
   * const loader = () => { loadCount++; return Promise.resolve(1); };
   *
   * const [a, b] = await Promise.all([
   *   cache.getOrLoad("x", loader),
   *   cache.getOrLoad("x", loader),
   * ]);
   *
   * assertEquals(a, 1);
   * assertEquals(b, 1);
   * assertEquals(loadCount, 1);
   * ```
   *
   * @example Per-entry TTL override
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   * import { FakeTime } from "@std/testing/time";
   *
   * using time = new FakeTime(0);
   * using cache = new Cache<string, number>({ maxSize: 100, ttl: 10000 });
   * await cache.getOrLoad("a", () => Promise.resolve(1), { ttl: 50 });
   *
   * time.tick(51);
   * assertEquals(cache.get("a"), undefined);
   * ```
   */
  getOrLoad(
    key: K,
    loader: (key: K) => Promise<V>,
    options?: CacheSetOptions,
  ): Promise<V> {
    const entry = this.#data.get(key);
    if (entry !== undefined) {
      const now = Date.now();
      if (!this.#isExpired(entry, now)) {
        return Promise.resolve(this.#touch(key, entry, now));
      }
      this.#stats.expirations++;
      this.#removeEntry(key, entry, "expired");
    }
    this.#stats.misses++;

    const existing = this.#inFlight?.get(key);
    if (existing) return existing;

    const inFlight = (this.#inFlight ??= new Map());
    let loaderResult: Promise<V>;
    try {
      loaderResult = loader(key);
    } catch (error) {
      return Promise.reject(error);
    }
    const promise = loaderResult.then(
      (value) => {
        // Any concurrent set/delete/clear on this key clears the inFlight
        // entry, so this check alone is sufficient to detect discards.
        if (inFlight.get(key) !== promise) return value;
        inFlight.delete(key);
        this.set(key, value, options);
        return value;
      },
      (error) => {
        if (inFlight.get(key) === promise) {
          inFlight.delete(key);
        }
        throw error;
      },
    );

    inFlight.set(key, promise);
    return promise;
  }

  /**
   * Removes the entry with the given key.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to delete.
   * @returns `true` if the key existed, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assertEquals(cache.delete("a"), true);
   * assertEquals(cache.delete("a"), false);
   * ```
   */
  delete(key: K): boolean {
    this.#assertNotRemoving("delete entry in");
    this.#inFlight?.delete(key);
    const entry = this.#data.get(key);
    if (entry === undefined) return false;
    this.#stats.deletes++;
    this.#removeEntry(key, entry, "deleted");
    return true;
  }

  /**
   * Removes all entries. Fires
   * {@linkcode CacheOptionsBase.onRemove | onRemove} with reason `"cleared"`
   * for each entry.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns {void}
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.set("b", 2);
   * cache.clear();
   * assertEquals(cache.size, 0);
   * ```
   */
  clear(): void {
    this.#assertNotRemoving("clear");
    if (this.#timerId !== undefined) {
      clearTimeout(this.#timerId);
      this.#timerId = undefined;
      this.#scheduledDeadline = undefined;
    }
    this.#heap?.clear();
    this.#inFlight?.clear();
    this.#refreshing?.clear();
    const head = this.#head;
    this.#data.clear();
    this.#head = undefined;
    this.#tail = undefined;
    if (!this.#onRemove) return;
    this.#removingDepth++;
    const errors: unknown[] = [];
    try {
      let node = head;
      while (node !== undefined) {
        try {
          this.#onRemove(node.key, node.value, "cleared");
        } catch (e) {
          errors.push(e);
        }
        node = node.next;
      }
    } finally {
      this.#removingDepth--;
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors);
  }

  /**
   * Iterate over all live (non-expired) keys.
   *
   * @returns An iterator over keys.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.set("b", 2);
   * assertEquals([...cache.keys()], ["a", "b"]);
   * ```
   */
  *keys(): IterableIterator<K> {
    // Snapshot live keys up front so that mutations performed by the
    // consumer during iteration (delete, set, clear) cannot corrupt the
    // linked-list traversal. Entries added after iteration begins are not
    // visited; entries deleted after iteration begins are still yielded.
    const now = Date.now();
    const snapshot: K[] = [];
    for (let node = this.#head; node !== undefined; node = node.next) {
      if (!this.#isExpired(node, now)) snapshot.push(node.key);
    }
    yield* snapshot;
  }

  /**
   * Iterate over all live (non-expired) values.
   *
   * @returns An iterator over values.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.set("b", 2);
   * assertEquals([...cache.values()], [1, 2]);
   * ```
   */
  *values(): IterableIterator<V> {
    const now = Date.now();
    const snapshot: V[] = [];
    for (let node = this.#head; node !== undefined; node = node.next) {
      if (!this.#isExpired(node, now)) snapshot.push(node.value);
    }
    yield* snapshot;
  }

  /**
   * Iterate over all live (non-expired) entries as `[key, value]` pairs.
   *
   * @returns An iterator over `[key, value]` pairs.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * cache.set("b", 2);
   * assertEquals([...cache.entries()], [["a", 1], ["b", 2]]);
   * ```
   */
  *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    const snapshot: [K, V][] = [];
    for (let node = this.#head; node !== undefined; node = node.next) {
      if (!this.#isExpired(node, now)) snapshot.push([node.key, node.value]);
    }
    yield* snapshot;
  }

  /**
   * Calls the given function for each live (non-expired) entry.
   *
   * @param callback The function to call for each entry.
   * @returns {void}
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * const keys: string[] = [];
   * cache.forEach((_v, k) => keys.push(k));
   * assertEquals(keys, ["a"]);
   * ```
   */
  forEach(callback: (value: V, key: K, cache: Cache<K, V>) => void): void {
    const now = Date.now();
    const snapshot: [K, V][] = [];
    for (let node = this.#head; node !== undefined; node = node.next) {
      if (!this.#isExpired(node, now)) snapshot.push([node.key, node.value]);
    }
    for (const [key, value] of snapshot) callback(value, key, this);
  }

  /**
   * Iterate over all live (non-expired) entries as `[key, value]` pairs.
   *
   * @returns An iterator over `[key, value]` pairs.
   *
   * @example Usage
   * ```ts
   * import { Cache } from "@std/cache/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new Cache<string, number>({ maxSize: 100 });
   * cache.set("a", 1);
   * assertEquals([...cache], [["a", 1]]);
   * ```
   */
  *[Symbol.iterator](): IterableIterator<[K, V]> {
    yield* this.entries();
  }

  /**
   * Clears all entries and cancels all timers. Safe for use with `using`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns {void}
   *
   * @example Usage
   * ```ts no-assert
   * import { Cache } from "@std/cache/cache";
   *
   * {
   *   using cache = new Cache<string, number>({ maxSize: 10, ttl: 5000 });
   *   cache.set("a", 1);
   * }
   * ```
   */
  [Symbol.dispose](): void {
    this.clear();
  }
}
