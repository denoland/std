// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * In-memory cache utilities, such as memoization and caches with different
 * expiration policies.
 *
 * ```ts
 * import { memoize, LruCache, type MemoizationCacheResult } from "@std/cache";
 * import { assertEquals } from "@std/assert";
 *
 * const cache = new LruCache<string, MemoizationCacheResult<bigint>>(1000);
 *
 * // fibonacci function, which is very slow for n > ~30 if not memoized
 * const fib = memoize((n: bigint): bigint => {
 *   return n <= 2n ? 1n : fib(n - 1n) + fib(n - 2n);
 * }, { cache });
 *
 * assertEquals(fib(100n), 354224848179261915075n);
 * ```
 *
 * @module
 */

export * from "./lru_cache.ts";
export * from "./memoize.ts";
export * from "./ttl_cache.ts";
