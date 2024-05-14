// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { LruCache } from "./lru_cache.ts";

export type MemoizationCache<K, V> = {
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  set: (key: K, val: V) => unknown;
  delete: (key: K) => unknown;
};

export type MemoizationOptions<Fn extends (...args: never[]) => unknown> = {
  /**
   * Provide a custom cache for getting previous results. By default, a new
   * `Map` object is instantiated upon memoization and used as a cache.
   */
  cache?: MemoizationCache<unknown, ReturnType<Fn>>;
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
  getKey?: (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) => unknown;
  /**
   * Only use args as cache keys up to the `length` property of the function.
   * Useful for passing unary functions as array callbacks, but should be
   * avoided for functions with variable argument length (`...rest` or default
   * params)
   *
   * @default false
   */
  truncateArgs?: boolean;
  /**
   * By default, promises are automatically removed from the cache upon
   * rejection. If `cacheRejectedPromises` is set to `true`, promises will be
   * retained in the cache even if rejected.
   *
   * @default false
   */
  cacheRejectedPromises?: boolean;
};

// used for memoizing the `memoize` function itself to enable on-the-fly usage
const _cache: LruCache<unknown, ReturnType<typeof memoize>> = new LruCache(100);
const _getKey: ReturnType<typeof _serializeArgList> = _serializeArgList(_cache);

/**
 * Cache the results of a function based on its arguments.
 *
 * @param fn - The function to memoize
 * @param options - Options for memoization
 *
 * @example
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
 */
const memoize_: typeof memoize = memoize(memoize, {
  cache: _cache,
  getKey(fn, options) {
    const optionVals = Object.entries(options ?? {})
      .sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0)
      .map(([, v]) => v);
    return _getKey(fn, ...optionVals);
  },
});

export { memoize_ as memoize };

function memoize<Fn extends (...args: never[]) => unknown>(
  fn: Fn,
  options?: NoInfer<Partial<MemoizationOptions<Fn>>>,
): Fn & {
  cache: MemoizationCache<unknown, ReturnType<Fn>>;
  getKey: (this: ThisParameterType<Fn>, ...args: Parameters<Fn>) => unknown;
} {
  const cache = options?.cache ?? new Map();
  const getKey = options?.getKey ?? _serializeArgList(cache);
  const truncateArgs = options?.truncateArgs ?? false;
  const cacheRejectedPromises = options?.cacheRejectedPromises ?? false;

  const memoized = function (
    this: ThisParameterType<Fn>,
    ...args: Parameters<Fn>
  ): ReturnType<Fn> {
    if (truncateArgs) args = args.slice(0, fn.length) as Parameters<Fn>;

    const key = getKey.apply(this, args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    let val = fn.apply(this, args) as ReturnType<Fn>;

    if (val instanceof Promise && !cacheRejectedPromises) {
      val = val.catch((reason) => {
        cache.delete(key);
        throw reason;
      }) as typeof val;
    }

    cache.set(key, val);

    return val;
  } as Fn;

  return Object.defineProperties(Object.assign(memoized, { cache, getKey }), {
    length: { value: fn.length },
    name: { value: fn.name },
  });
}

/** Default serialization of arguments list for use as cache keys */
export function _serializeArgList<Return>(
  cache: MemoizationCache<unknown, Return>,
): (this: unknown, ...args: unknown[]) => string {
  const weakKeyToKeySegmentCache = new WeakMap<WeakKey, string>();
  const weakKeySegmentToKeyCache = new Map<string, string[]>();
  let i = 0;

  const registry = new FinalizationRegistry<string>((keySegment) => {
    for (const key of weakKeySegmentToKeyCache.get(keySegment) ?? []) {
      cache.delete(key);
    }
    weakKeySegmentToKeyCache.delete(keySegment);
  });

  return function (...args) {
    const weakKeySegments: string[] = [];
    const keySegments = [this, ...args].map((arg) => {
      if (typeof arg === "undefined") return "undefined";
      if (typeof arg === "bigint") return `${arg}n`;

      if (
        arg === null ||
        ["string", "boolean", "number", "record", "tuple"].includes(typeof arg)
      ) {
        // null, string, boolean, number, or one of the upcoming
        // [record/tuple](https://github.com/tc39/proposal-record-tuple)
        // ECMAScript types
        try {
          return JSON.stringify(arg);
        } catch { /* fallthrough to weak cache */ }
      }

      try {
        assertWeakKey(arg);
      } catch (e) {
        if (typeof arg === "symbol") {
          return `Symbol.for(${JSON.stringify(arg.description)})`;
        }
        throw e;
      }

      if (!weakKeyToKeySegmentCache.has(arg)) {
        const keySegment = `{${i++}}`;
        weakKeySegments.push(keySegment);
        registry.register(arg, keySegment);
        weakKeyToKeySegmentCache.set(arg, keySegment);
      }

      const keySegment = weakKeyToKeySegmentCache.get(arg)!;
      weakKeySegments.push(keySegment);
      return keySegment;
    });

    const key = keySegments.join(",");

    for (const keySegment of weakKeySegments) {
      const keys = weakKeySegmentToKeyCache.get(keySegment) ?? [];
      keys.push(key);
      weakKeySegmentToKeyCache.set(keySegment, keys);
    }

    return key;
  };
}

function assertWeakKey(arg: unknown): asserts arg is WeakKey {
  new WeakRef(arg as WeakKey);
}
