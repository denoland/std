// Copyright 2018-2025 the Deno authors. MIT license.
import type { MemoizationCache } from "./memoize.ts";

/**
 * Time-to-live cache.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Automatically removes entries after the configured amount of time elapses.
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
   * Constructs a new instance.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param defaultTtl The default time-to-live in milliseconds. This value must
   * be equal to or greater than 0. Its limit is determined by the current
   * runtime's {@linkcode setTimeout} implementation.
   */
  constructor(defaultTtl: number) {
    super();
    this.#defaultTtl = defaultTtl;
  }

  /**
   * Set a value in the cache.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The cache key
   * @param value The value to set
   * @param ttl A custom time-to-live. If supplied, overrides the cache's
   * default TTL for this entry. This value must
   * be equal to or greater than 0. Its limit is determined by the current
   * runtime's {@linkcode setTimeout} implementation.
   * @returns `this` for chaining.
   *
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { assertEquals } from "@std/assert/equals";
   * import { delay } from "@std/async/delay";
   *
   * const cache = new TtlCache<string, number>(100);
   *
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   *
   * await delay(200);
   * assertEquals(cache.get("a"), undefined);
   * ```
   */
  override set(key: K, value: V, ttl: number = this.#defaultTtl): this {
    clearTimeout(this.#timeouts.get(key));
    super.set(key, value);
    this.#timeouts.set(key, setTimeout(() => this.delete(key), ttl));
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
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new TtlCache<string, number>(1000);
   *
   * cache.set("a", 1);
   * cache.delete("a");
   * assertEquals(cache.has("a"), false);
   * ```
   */
  override delete(key: K): boolean {
    clearTimeout(this.#timeouts.get(key));
    this.#timeouts.delete(key);
    return super.delete(key);
  }

  /**
   * Clears the cache.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new TtlCache<string, number>(1000);
   *
   * cache.set("a", 1);
   * cache.set("b", 2);
   * cache.clear();
   * assertEquals(cache.size, 0);
   * ```
   */
  override clear(): void {
    for (const timeout of this.#timeouts.values()) {
      clearTimeout(timeout);
    }
    this.#timeouts.clear();
    super.clear();
  }

  /**
   * Automatically clears all remaining timeouts once the cache goes out of
   * scope if the cache is declared with `using`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts no-assert
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * let c: TtlCache<string, number>;
   * {
   *  using cache = new TtlCache<string, number>(1000);
   *  cache.set("a", 1);
   *  c = cache;
   * }
   * assertEquals(c.size, 0);
   * ```
   */
  [Symbol.dispose](): void {
    this.clear();
  }
}
