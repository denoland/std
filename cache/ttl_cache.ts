// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { MemoizationCache } from "./memoize.ts";

/**
 * Time-to-live cache.
 *
 * Automatically removes entries once the configured amount of time elapses.
 *
 * @typeParam K The type of the cache keys.
 * @typeParam V The type of the cache values.
 *
 * @example Usage
 * ```ts
 * import { TtlCache } from "@std/cache/ttl-cache";
 * import { assertEquals } from "@std/assert/equals";
 * import { delay } from "@std/async/delay";
 *
 * const cache = new TtlCache<string, number>(1000);
 *
 * cache.set("a", 1);
 * assertEquals(cache.size, 1);
 * await delay(2000);
 * assertEquals(cache.size, 0);
 * ```
 */
export class TtlCache<K, V> extends Map<K, V>
  implements MemoizationCache<K, V> {
  #defaultTtl: number;
  #timeouts = new Map<K, number>();

  /**
   * Construct a new `TtlCache`.
   * @param defaultTtl The default time-to-live in milliseconds
   */
  constructor(defaultTtl: number) {
    super();
    this.#defaultTtl = defaultTtl;
  }

  /**
   * Set a value in the cache.
   *
   * @param key The cache key
   * @param value The value to set
   * @param ttl A custom time-to-live. If supplied, overrides the cache's default TTL for this entry.
   * @returns `this` for chaining.
   *
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new TtlCache<string, number>(1000);
   *
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   * ```
   */
  override set(key: K, value: V, ttl: number = this.#defaultTtl): this {
    clearTimeout(this.#timeouts.get(key));
    super.set(key, value);

    const timeout = setTimeout(() => {
      super.delete(key);
      this.#timeouts.delete(key);
    }, ttl);

    this.#timeouts.set(key, timeout);

    return this;
  }
}
