// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

// deno-lint-ignore no-unused-vars
import type { LruCache } from "./lru_cache.ts";
import { _serializeArgList } from "./_serialize_arg_list.ts";

/**
 * A cache suitable for use with {@linkcode memoize}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type MemoizationCache<K, V> = {
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  set: (key: K, val: V) => unknown;
  delete: (key: K) => unknown;
};

/**
 * The result of a memoized function, as stored in its cache.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type MemoizationCacheResult<T> =
  | { kind: "ok"; value: T }
  | { kind: "error"; error: unknown }
  | (T extends Promise<unknown> ? { kind: "promise"; value: T } : never);

/**
 * Options for {@linkcode memoize}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam Fn The type of the function to memoize.
 * @typeParam Key The type of the cache key.
 * @typeParam Cache The type of the cache.
 */
export type MemoizeOptions<
  Fn extends (...args: never[]) => unknown,
  Key,
  Cache extends MemoizationCache<Key, MemoizationCacheResult<ReturnType<Fn>>>,
> = {
  /**
   * Provide a custom cache for getting previous results. By default, a new
   * {@linkcode Map} object is instantiated upon memoization and used as a cache, with no
   * limit on the number of results to be cached.
   *
   * Alternatively, you can supply a {@linkcode LruCache} with a specified max
   * size to limit memory usage.
   */
  cache?: Cache;
  /**
   * Function to get a unique cache key from the function's arguments. By
   * default, a composite key is created from all the arguments plus the `this`
   * value, using reference equality to check for equivalence.
   *
   * @example
   * ```ts
   * import { memoize } from "@std/cache";
   * import { assertEquals } from "@std/assert";
   *
   * const fn = memoize(({ value }: { cacheKey: number; value: number }) => {
   *   return value;
   * }, { getKey: ({ cacheKey }) => cacheKey });
   *
   * assertEquals(fn({ cacheKey: 1, value: 2 }), 2);
   * assertEquals(fn({ cacheKey: 1, value: 99 }), 2);
   * assertEquals(fn({ cacheKey: 2, value: 99 }), 99);
   * ```
   */
  getKey?: (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) => Key;
  /**
   * Callback to determine if an error or other thrown value is cacheable.
   *
   * @default {() => false}
   *
   * @param err The thrown error or other value.
   * @returns `true` if the error is cacheable, `false` otherwise.
   */
  errorIsCacheable?: (err: unknown) => boolean;
};

/**
 * Cache the results of a function based on its arguments.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam Fn The type of the function to memoize.
 * @typeParam Key The type of the cache key.
 * @typeParam Cache The type of the cache.
 * @param fn The function to memoize
 * @param options Options for memoization
 *
 * @returns The memoized function.
 *
 * @example Basic usage
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
 * > [!NOTE]
 * > * By default, memoization is on the basis of all arguments passed to the
 * >   function, with equality determined by reference. This means that, for
 * >   example, passing a memoized function as `arr.map(func)` will not use the
 * >   cached results, as the index is implicitly passed as an argument. To
 * >   avoid this, you can pass a custom `getKey` option or use the memoized
 * >   function inside an anonymous callback like `arr.map((x) => func(x))`.
 */
export function memoize<
  Fn extends (...args: never[]) => unknown,
  Key = string,
  Cache extends MemoizationCache<Key, MemoizationCacheResult<ReturnType<Fn>>> =
    Map<
      Key,
      MemoizationCacheResult<ReturnType<Fn>>
    >,
>(
  fn: Fn,
  options?: MemoizeOptions<Fn, Key, Cache>,
): Fn {
  const cache = options?.cache ?? new Map();
  const getKey = options?.getKey ??
    _serializeArgList(
      cache as MemoizationCache<unknown, unknown>,
    ) as unknown as (
      (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) => Key
    );
  const errorIsCacheable = options?.errorIsCacheable ?? (() => false);

  const memoized = function (
    this: ThisParameterType<Fn>,
    ...args: Parameters<Fn>
  ): ReturnType<Fn> {
    const key = getKey.apply(this, args) as Key;

    if (cache.has(key)) {
      const result = cache.get(key)!;
      switch (result.kind) {
        case "ok":
        case "promise":
          return result.value;
        case "error":
          throw result.error;
      }
    }

    try {
      let value = fn.apply(this, args) as ReturnType<Fn>;

      if (value instanceof Promise) {
        value = value.catch((reason) => {
          if (!errorIsCacheable(reason)) {
            cache.delete(key);
          }
          throw reason;
        }) as typeof value;

        cache.set(
          key,
          { kind: "promise", value } as MemoizationCacheResult<ReturnType<Fn>>,
        );
      } else {
        cache.set(key, { kind: "ok", value });
      }

      return value;
    } catch (e) {
      if (errorIsCacheable(e)) {
        cache.set(key, { kind: "error", error: e });
      }

      throw e;
    }
  } as Fn;

  return Object.defineProperties(
    memoized,
    {
      length: { value: fn.length },
      name: { value: fn.name },
    },
  );
}
