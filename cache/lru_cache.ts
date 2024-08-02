// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { MemoizationCache } from "./memoize.ts";
export type { MemoizationCache } from "./memoize.ts";

/**
 * [Least-recently-used](
 * 	https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 * ) cache.
 *
 * Automatically removes entries above the max size based on when they were
 * last accessed with `get`, `set`, or `has`.
 *
 * @example
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
 */
export class LruCache<K, V> extends Map<K, V>
  implements MemoizationCache<K, V> {
  /**
   * Constructs a new `LruCache`.
   *
   * @param maxSize The maximum number of entries to store in the cache.
   */
  constructor(public maxSize: number) {
    super();
  }

  #setMostRecentlyUsed(key: K, value: V): void {
    // delete then re-add to ensure most recently accessed elements are last
    super.delete(key);
    super.set(key, value);
  }

  #pruneToMaxSize(): void {
    if (this.size > this.maxSize) {
      this.delete(this.keys().next().value);
    }
  }

  /**
   * Checks whether an element with the specified key exists or not.
   */
  override has(key: K): boolean {
    const exists = super.has(key);

    if (exists) {
      this.#setMostRecentlyUsed(key, super.get(key)!);
    }

    return exists;
  }

  /**
   * Gets the element with the specified key.
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
   * Sets the specified key to the specified value.
   */
  override set(key: K, value: V): this {
    this.#setMostRecentlyUsed(key, value);
    this.#pruneToMaxSize();

    return this;
  }
}
