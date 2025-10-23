// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

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

  #eject: (ejectedKey: K, ejectedValue: V) => void = () => {};

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
   * Registers a function to be called when a value is evicted.
   *
   * @param callback the function to be called.
   * @returns `this` for chaining.
   *
   * @example Registering a function to the cache
   * ```ts
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { delay } from "@std/async/delay";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const cache = new TtlCache<string, string>(100)
   *  .onEject((key, value) => {
   *     console.log("Revoking: ", key)
   *     URL.revokeObjectURL(value)
   * });
   *
   * cache.set(
   *  "fast-url",
   *  URL.createObjectURL(new Blob(["Hello, World"], { type: "text/plain" }))
   * );
   *
   * await delay(200) // "Revoking: fast-url"
   * assertEquals(cache.get("fast-url"), undefined)
   * ```
   */
  onEject(callback: (ejectedKey: K, ejectedValue: V) => void): this {
    this.#eject = callback;
    return this;
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
    const value = super.get(key);
    if (value) {
      this.#eject(key, value);
    }
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
