// Copyright 2018-2026 the Deno authors. MIT license.
import type { MemoizationCache } from "./memoize.ts";

/**
 * Default serialization of arguments list for use as cache keys. Equivalence
 * follows [`SameValueZero`](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero)
 * reference equality, such that `getKey(x, y) === getKey(x, y)` for all values
 * of `x` and `y`, but `getKey({}) !== getKey({})`.
 *
 * @param cache The cache for which the keys will be used.
 * @returns `getKey`, the function for getting cache keys.
 */

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

  return function getKey(...args) {
    const weakKeySegments: string[] = [];
    const keySegments = [this, ...args].map((arg) => {
      if (typeof arg === "undefined") return "undefined";
      if (typeof arg === "bigint") return `${arg}n`;

      if (typeof arg === "number") {
        return String(arg);
      }

      if (
        arg === null ||
        typeof arg === "string" ||
        typeof arg === "boolean"
      ) {
        // This branch will need to be updated if further types are added to
        // the language that support value equality,
        // e.g. https://github.com/tc39/proposal-record-tuple
        return JSON.stringify(arg);
      }

      try {
        assertWeakKey(arg);
      } catch {
        if (typeof arg === "symbol") {
          return `Symbol.for(${JSON.stringify(arg.description)})`;
        }
        // Non-weak keys other than `Symbol.for(...)` are handled by the branches above.
        throw new Error(
          "Should be unreachable: please open an issue at https://github.com/denoland/std/issues/new",
        );
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
