// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * In-memory cache utilities, such as memoization.
 *
 * ```ts
 * import { memoize } from "@std/cache";
 * import { assertEquals } from "@std/assert";
 *
 * // fibonacci function, which is very slow for n > ~30 if not memoized
 * const fib = memoize((n: bigint): bigint => {
 *   return n <= 2n ? 1n : fib(n - 1n) + fib(n - 2n);
 * });
 *
 * assertEquals(fib(100n), 354224848179261915075n);
 * ```
 *
 * @module
 */

export * from "./memoize.ts";
