// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { MemoizationCache } from "./memoize.ts";

/**
 * The reason an entry was removed from the cache.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * - `"evicted"` — removed automatically because the cache exceeded
 *   {@linkcode LruCache.prototype.maxSize | maxSize}.
 * - `"deleted"` — removed by an explicit
 *   {@linkcode LruCache.prototype.delete | delete()} call.
 * - `"cleared"` — removed by
 *   {@linkcode LruCache.prototype.clear | clear()}.
 */
export type LruCacheEjectionReason = "evicted" | "deleted" | "cleared";

/**
 * Options for the {@linkcode LruCache} constructor.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface LruCacheOptions<K, V> {
  /**
   * Callback invoked when an entry is removed, whether by eviction,
   * manual deletion, or clearing the cache. The entry is already removed
   * from the cache when this callback fires. Overwriting an existing key
   * via {@linkcode LruCache.prototype.set | set()} does **not** trigger
   * this callback. The cache is not re-entrant during this callback:
   * calling `set`, `delete`, or `clear` will throw.
   *
   * @param ejectedKey The key of the removed entry.
   * @param ejectedValue The value of the removed entry.
   * @param reason Why the entry was removed.
   */
  onEject?: (
    ejectedKey: K,
    ejectedValue: V,
    reason: LruCacheEjectionReason,
  ) => void;
}

/**
 * Least-recently-used cache.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU | Least-recently-used cache}
 *
 * Automatically removes entries above the max size based on when they were
 * last accessed with `get` or `set`.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 *
 * @example Basic usage
 * ```ts
 * import { LruCache } from "@std/cache";
 * import { assert, assertEquals } from "@std/assert";
 *
 * const MAX_SIZE = 3;
 * const cache = new LruCache<string, number>(MAX_SIZE);
 *
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);
 * cache.set("d", 4);
 *
 * // most recent values are stored up to `MAX_SIZE`
 * assertEquals(cache.get("b"), 2);
 * assertEquals(cache.get("c"), 3);
 * assertEquals(cache.get("d"), 4);
 *
 * // less recent values are removed
 * assert(!cache.has("a"));
 * ```
 *
 * @example Adding an onEject callback
 * ```ts
 * import { LruCache } from "@std/cache";
 * import { assertEquals } from "@std/assert";
 *
 * const ejected: [string, number, string][] = [];
 * const cache = new LruCache<string, number>(2, {
 *   onEject: (key, value, reason) => ejected.push([key, value, reason]),
 * });
 *
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);
 *
 * assertEquals(ejected, [["a", 1, "evicted"]]);
 * ```
 */
export class LruCache<K, V> extends Map<K, V>
  implements MemoizationCache<K, V> {
  #maxSize: number;
  #ejecting = false;
  #eject?:
    | ((ejectedKey: K, ejectedValue: V, reason: LruCacheEjectionReason) => void)
    | undefined;

  /**
   * Constructs a new `LruCache`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param maxSize The maximum number of entries to store in the cache. Must
   * be a positive integer.
   * @param options Additional options.
   */
  constructor(
    maxSize: number,
    options?: LruCacheOptions<K, V>,
  ) {
    super();
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new RangeError(
        `Cannot create LruCache: maxSize must be a positive integer: received ${maxSize}`,
      );
    }
    this.#maxSize = maxSize;
    this.#eject = options?.onEject;
  }

  /**
   * The maximum number of entries to store in the cache.
   *
   * @returns The maximum number of entries in the cache.
   *
   * @example Max size
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new LruCache<string, number>(100);
   * assertEquals(cache.maxSize, 100);
   * ```
   */
  get maxSize(): number {
    return this.#maxSize;
  }

  #setMostRecentlyUsed(key: K, value: V): void {
    super.delete(key);
    super.set(key, value);
  }

  #pruneToMaxSize(): void {
    if (this.size <= this.#maxSize) return;
    const key = this.keys().next().value!;
    const value = super.get(key)!;
    super.delete(key);
    if (this.#eject) {
      this.#ejecting = true;
      try {
        this.#eject(key, value, "evicted");
      } finally {
        this.#ejecting = false;
      }
    }
  }

  /**
   * Checks whether an element with the specified key exists or not. Does
   * **not** update the entry's position in the eviction order.
   *
   * @param key The key to check.
   * @returns `true` if the cache contains the specified key, otherwise `false`.
   *
   * @example Checking for the existence of a key
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assert } from "@std/assert";
   *
   * const cache = new LruCache<string, number>(100);
   *
   * cache.set("a", 1);
   * assert(cache.has("a"));
   * ```
   */
  override has(key: K): boolean {
    return super.has(key);
  }

  /**
   * Gets the element with the specified key.
   *
   * @param key The key to get the value for.
   * @returns The value associated with the specified key, or `undefined` if
   * the key is not present in the cache.
   *
   * @example Getting a value from the cache
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new LruCache<string, number>(100);
   *
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   * ```
   */
  override get(key: K): V | undefined {
    if (super.has(key)) {
      const value = super.get(key)!;
      this.#setMostRecentlyUsed(key, value);
      return value;
    }

    return undefined;
  }

  /**
   * Returns the value associated with the given key, or `undefined` if the
   * key is not present, **without** updating its position in the eviction
   * order.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up.
   * @returns The value, or `undefined` if not present.
   *
   * @example Peeking at a value without promoting it
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const cache = new LruCache<string, number>(3);
   * cache.set("a", 1);
   * cache.set("b", 2);
   * cache.set("c", 3);
   *
   * // peek does not promote "a"
   * assertEquals(cache.peek("a"), 1);
   *
   * // "a" is still the least recently used and gets evicted
   * cache.set("d", 4);
   * assertEquals(cache.peek("a"), undefined);
   * ```
   */
  peek(key: K): V | undefined {
    return super.get(key);
  }

  /**
   * Sets the specified key to the specified value.
   *
   * @param key The key to set the value for.
   * @param value The value to set.
   * @returns `this` for chaining.
   *
   * @example Setting a value in the cache
   * ```ts no-assert
   * import { LruCache } from "@std/cache";
   *
   * const cache = new LruCache<string, number>(100);
   * cache.set("a", 1);
   * ```
   */
  override set(key: K, value: V): this {
    if (this.#ejecting) {
      throw new Error(
        "Cannot set entry in LruCache: cache is not re-entrant during onEject callbacks",
      );
    }
    this.#setMostRecentlyUsed(key, value);
    this.#pruneToMaxSize();

    return this;
  }

  /**
   * Deletes the value associated with the given key.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to delete.
   * @returns `true` if the key was deleted, `false` otherwise.
   *
   * @example Deleting a key from the cache
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new LruCache<string, number>(1);
   *
   * cache.set("a", 1);
   * cache.delete("a");
   * assertEquals(cache.has("a"), false);
   * ```
   */
  override delete(key: K): boolean {
    if (this.#ejecting) {
      throw new Error(
        "Cannot delete entry in LruCache: cache is not re-entrant during onEject callbacks",
      );
    }
    const value = super.get(key);
    const existed = super.delete(key);
    if (!existed) return false;

    if (this.#eject) {
      this.#ejecting = true;
      try {
        this.#eject(key, value!, "deleted");
      } finally {
        this.#ejecting = false;
      }
    }
    return true;
  }

  /**
   * Clears the cache.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { LruCache } from "@std/cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new LruCache<string, number>(100);
   *
   * cache.set("a", 1);
   * cache.set("b", 2);
   * cache.clear();
   * assertEquals(cache.size, 0);
   * ```
   */
  override clear(): void {
    if (this.#ejecting) {
      throw new Error(
        "Cannot clear LruCache: cache is not re-entrant during onEject callbacks",
      );
    }
    if (!this.#eject) {
      super.clear();
      return;
    }
    const entries = [...super.entries()];
    super.clear();
    this.#ejecting = true;
    let error: unknown;
    try {
      for (const [key, value] of entries) {
        try {
          this.#eject(key, value, "cleared");
        } catch (e) {
          error ??= e;
        }
      }
    } finally {
      this.#ejecting = false;
    }
    if (error !== undefined) throw error;
  }
}
