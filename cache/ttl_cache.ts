// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { MemoizationCache } from "./memoize.ts";

/**
 * Options for {@linkcode TtlCache.prototype.set}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TtlCacheSetOptions {
  /**
   * A custom time-to-live in milliseconds for this entry. If supplied,
   * overrides the cache's default TTL. Must be a finite, non-negative number.
   */
  ttl?: number;
}

/**
 * Options for the {@linkcode TtlCache} constructor.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TtlCacheOptions<K, V> {
  /**
   * Callback invoked when an entry is removed, whether by TTL expiry,
   * manual deletion, or clearing the cache.
   */
  onEject?: (ejectedKey: K, ejectedValue: V) => void;
}

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
 *
 * @example Adding an onEject callback
 * ```ts
 * import { TtlCache } from "@std/cache/ttl-cache";
 * import { delay } from "@std/async/delay";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const cache = new TtlCache<string, string>(100, { onEject: (key, value) => {
 *  console.log("Revoking: ", key)
 *  URL.revokeObjectURL(value)
 * }})
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
export class TtlCache<K, V> extends Map<K, V>
  implements MemoizationCache<K, V> {
  #defaultTtl: number;
  #timeouts = new Map<K, number>();
  #eject?: ((ejectedKey: K, ejectedValue: V) => void) | undefined;

  /**
   * Constructs a new instance.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param defaultTtl The default time-to-live in milliseconds. This value must
   * be a finite, non-negative number. Its upper limit is determined by the
   * current runtime's {@linkcode setTimeout} implementation.
   * @param options Additional options.
   */
  constructor(
    defaultTtl: number,
    options?: TtlCacheOptions<K, V>,
  ) {
    super();
    if (!(defaultTtl >= 0) || !Number.isFinite(defaultTtl)) {
      throw new RangeError(
        `Cannot create TtlCache: defaultTtl must be a finite, non-negative number: received ${defaultTtl}`,
      );
    }
    this.#defaultTtl = defaultTtl;
    this.#eject = options?.onEject;
  }

  /**
   * Set a value in the cache.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The cache key.
   * @param value The value to set.
   * @param options Options for this entry.
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
  override set(key: K, value: V, options?: TtlCacheSetOptions): this {
    const ttl = options?.ttl ?? this.#defaultTtl;
    if (!(ttl >= 0) || !Number.isFinite(ttl)) {
      throw new RangeError(
        `Cannot set entry in TtlCache: ttl must be a finite, non-negative number: received ${ttl}`,
      );
    }

    const existing = this.#timeouts.get(key);
    if (existing !== undefined) clearTimeout(existing);
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
    const existed = super.delete(key);
    if (!existed) return false;

    const timeout = this.#timeouts.get(key);
    if (timeout !== undefined) clearTimeout(timeout);
    this.#timeouts.delete(key);
    this.#eject?.(key, value!);
    return true;
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
    const entries = [...super.entries()];
    super.clear();
    let error: unknown;
    for (const [key, value] of entries) {
      try {
        this.#eject?.(key, value);
      } catch (e) {
        error ??= e;
      }
    }
    if (error !== undefined) throw error;
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
