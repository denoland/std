// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { MemoizationCache } from "./memoize.ts";

/**
 * Options for {@linkcode TtlCache.prototype.set} when
 * {@linkcode TtlCacheOptions.slidingExpiration | slidingExpiration} is
 * disabled (the default).
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
 * Options for {@linkcode TtlCache.prototype.set} when
 * {@linkcode TtlCacheOptions.slidingExpiration | slidingExpiration} is
 * enabled.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TtlCacheSlidingSetOptions extends TtlCacheSetOptions {
  /**
   * A maximum lifetime in milliseconds for this entry, measured from the
   * time it is set. The sliding window cannot extend past this duration.
   */
  absoluteExpiration?: number;
}

/**
 * Options for the {@linkcode TtlCache} constructor.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam Sliding Whether sliding expiration is enabled.
 */
export interface TtlCacheOptions<K, V, Sliding extends boolean = boolean> {
  /**
   * Callback invoked when an entry is removed, whether by TTL expiry,
   * manual deletion, or clearing the cache.
   */
  onEject?: (ejectedKey: K, ejectedValue: V) => void;
  /**
   * When `true`, each {@linkcode TtlCache.prototype.get | get()} or
   * {@linkcode TtlCache.prototype.has | has()} call resets the entry's TTL.
   *
   * If both `slidingExpiration` and
   * {@linkcode TtlCacheSlidingSetOptions.absoluteExpiration | absoluteExpiration}
   * are set on an entry, the sliding window cannot extend past the absolute
   * expiration.
   *
   * @default {false}
   */
  slidingExpiration?: Sliding;
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
 * @example Sliding expiration
 * ```ts
 * import { TtlCache } from "@std/cache/ttl-cache";
 * import { assertEquals } from "@std/assert/equals";
 * import { FakeTime } from "@std/testing/time";
 *
 * using time = new FakeTime(0);
 * const cache = new TtlCache<string, number, true>(100, {
 *   slidingExpiration: true,
 * });
 *
 * cache.set("a", 1);
 * time.now = 80;
 * assertEquals(cache.get("a"), 1); // resets TTL
 * time.now = 160;
 * assertEquals(cache.get("a"), 1); // still alive, TTL was reset at t=80
 * time.now = 260;
 * assertEquals(cache.get("a"), undefined); // expired
 * ```
 */
export class TtlCache<K, V, Sliding extends boolean = false> extends Map<K, V>
  implements MemoizationCache<K, V> {
  #defaultTtl: number;
  #timeouts = new Map<K, number>();
  #eject?: ((ejectedKey: K, ejectedValue: V) => void) | undefined;
  #slidingExpiration: Sliding;
  #entryTtls = new Map<K, number>();
  #absoluteDeadlines = new Map<K, number>();

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
    options?: TtlCacheOptions<K, V, Sliding>,
  ) {
    super();
    if (!(defaultTtl >= 0) || !Number.isFinite(defaultTtl)) {
      throw new RangeError(
        `Cannot create TtlCache: defaultTtl must be a finite, non-negative number: received ${defaultTtl}`,
      );
    }
    this.#defaultTtl = defaultTtl;
    this.#eject = options?.onEject;
    this.#slidingExpiration = (options?.slidingExpiration ?? false) as Sliding;
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
  override set(
    key: K,
    value: V,
    options?: Sliding extends true ? TtlCacheSlidingSetOptions
      : TtlCacheSetOptions,
  ): this {
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

    if (this.#slidingExpiration) {
      const slidingOptions = options as TtlCacheSlidingSetOptions | undefined;
      this.#entryTtls.set(key, ttl);
      if (slidingOptions?.absoluteExpiration !== undefined) {
        const abs = slidingOptions.absoluteExpiration;
        if (!(abs >= 0) || !Number.isFinite(abs)) {
          throw new RangeError(
            `Cannot set entry in TtlCache: absoluteExpiration must be a finite, non-negative number: received ${abs}`,
          );
        }
        this.#absoluteDeadlines.set(key, Date.now() + abs);
      } else {
        this.#absoluteDeadlines.delete(key);
      }
    }

    return this;
  }

  /**
   * Gets the value associated with the specified key.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * When {@linkcode TtlCacheOptions.slidingExpiration | slidingExpiration} is
   * enabled, accessing an entry resets its TTL.
   *
   * @param key The key to get the value for.
   * @returns The value associated with the specified key, or `undefined` if
   * the key is not present in the cache.
   *
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { assertEquals } from "@std/assert/equals";
   *
   * using cache = new TtlCache<string, number>(1000);
   *
   * cache.set("a", 1);
   * assertEquals(cache.get("a"), 1);
   * ```
   */
  override get(key: K): V | undefined {
    if (!super.has(key)) return undefined;
    if (this.#slidingExpiration) this.#resetTtl(key);
    return super.get(key);
  }

  /**
   * Checks whether an element with the specified key exists.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * When {@linkcode TtlCacheOptions.slidingExpiration | slidingExpiration} is
   * enabled, checking an entry resets its TTL.
   *
   * @param key The key to check.
   * @returns `true` if the cache contains the specified key, otherwise `false`.
   *
   * @example Usage
   * ```ts
   * import { TtlCache } from "@std/cache/ttl-cache";
   * import { assert } from "@std/assert";
   *
   * using cache = new TtlCache<string, number>(1000);
   *
   * cache.set("a", 1);
   * assert(cache.has("a"));
   * ```
   */
  override has(key: K): boolean {
    const exists = super.has(key);
    if (exists && this.#slidingExpiration) this.#resetTtl(key);
    return exists;
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
    this.#entryTtls.delete(key);
    this.#absoluteDeadlines.delete(key);
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
    this.#entryTtls.clear();
    this.#absoluteDeadlines.clear();
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

  #resetTtl(key: K): void {
    const ttl = this.#entryTtls.get(key);
    if (ttl === undefined) return;

    const deadline = this.#absoluteDeadlines.get(key);
    const effectiveTtl = deadline !== undefined
      ? Math.min(ttl, Math.max(0, deadline - Date.now()))
      : ttl;

    const existing = this.#timeouts.get(key);
    if (existing !== undefined) clearTimeout(existing);
    this.#timeouts.set(
      key,
      setTimeout(() => this.delete(key), effectiveTtl),
    );
  }
}
