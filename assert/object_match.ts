// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertEquals } from "./equals.ts";

/**
 * Make an assertion that `expected` object is a subset of `actual` object,
 * deeply. If not, then throw.
 *
 * @example Usage
 * ```ts ignore
 * import { assertObjectMatch } from "@std/assert";
 *
 * assertObjectMatch({ foo: "bar" }, { foo: "bar" }); // Doesn't throw
 * assertObjectMatch({ foo: "bar" }, { foo: "baz" }); // Throws
 * assertObjectMatch({ foo: 1, bar: 2 }, { foo: 1 }); // Doesn't throw
 * assertObjectMatch({ foo: 1 }, { foo: 1, bar: 2 }); // Throws
 * ```
 *
 * @example Usage with nested objects
 * ```ts ignore
 * import { assertObjectMatch } from "@std/assert";
 *
 * assertObjectMatch({ foo: { bar: 3, baz: 4 } }, { foo: { bar: 3 } }); // Doesn't throw
 * assertObjectMatch({ foo: { bar: 3 } }, { foo: { bar: 3, baz: 4 } }); // Throws
 * ```
 *
 * @param actual The actual value to be matched.
 * @param expected The expected value to match.
 * @param msg The optional message to display if the assertion fails.
 */
export function assertObjectMatch(
  // deno-lint-ignore no-explicit-any
  actual: Record<PropertyKey, any>,
  expected: Record<PropertyKey, unknown>,
  msg?: string,
): void {
  return assertEquals(
    // get the intersection of "actual" and "expected"
    // side effect: all the instances' constructor field is "Object" now.
    filter(actual, expected),
    // set (nested) instances' constructor field to be "Object" without changing expected value.
    // see https://github.com/denoland/deno_std/pull/1419
    filter(expected, expected),
    msg,
  );
}

type loose = Record<PropertyKey, unknown>;

function isObject(val: unknown): boolean {
  return typeof val === "object" && val !== null;
}

function filter(a: loose, b: loose): loose {
  const seen = new WeakMap();
  return filterObject(a, b);

  function filterObject(a: loose, b: loose): loose {
    // Prevent infinite loop with circular references with same filter
    if ((seen.has(a)) && (seen.get(a) === b)) {
      return a;
    }

    try {
      seen.set(a, b);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new TypeError(
          `Cannot assertObjectMatch ${a === null ? null : `type ${typeof a}`}`,
        );
      }
    }

    // Filter keys and symbols which are present in both actual and expected
    const filtered = {} as loose;
    const keysA = Reflect.ownKeys(a);
    const keysB = Reflect.ownKeys(b);
    const entries = keysA.filter((key) => keysB.includes(key))
      .map((key) => [key, a[key as string]]) as Array<[string, unknown]>;

    if (keysA.length && keysB.length && !entries.length) {
      // If both objects are not empty but don't have the same keys or symbols,
      // returns the entries in object a.
      for (const key of keysA) {
        filtered[key] = a[key];
      }

      return filtered;
    }

    for (const [key, value] of entries) {
      // On regexp references, keep value as it to avoid loosing pattern and flags
      if (value instanceof RegExp) {
        filtered[key] = value;
        continue;
      }

      const subset = (b as loose)[key];

      // On array references, build a filtered array and filter nested objects inside
      if (Array.isArray(value) && Array.isArray(subset)) {
        filtered[key] = filterArray(value, subset);
        continue;
      }

      // On nested objects references, build a filtered object recursively
      if (isObject(value) && isObject(subset)) {
        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
        if ((value instanceof Map) && (subset instanceof Map)) {
          filtered[key] = new Map(
            [...value].filter(([k]) => subset.has(k)).map(
              ([k, v]) => {
                const v2 = subset.get(k);
                if (isObject(v) && isObject(v2)) {
                  return [k, filterObject(v as loose, v2 as loose)];
                }

                return [k, v];
              },
            ),
          );
          continue;
        }

        // When both operands are set, build a filtered set with common values
        if ((value instanceof Set) && (subset instanceof Set)) {
          filtered[key] = value.intersection(subset);
          continue;
        }

        filtered[key] = filterObject(value as loose, subset as loose);
        continue;
      }

      filtered[key] = value;
    }

    return filtered;
  }

  function filterArray(a: unknown[], b: unknown[]): unknown[] {
    // Prevent infinite loop with circular references with same filter
    if (seen.has(a) && (seen.get(a) === b)) {
      return a;
    }

    seen.set(a, b);

    const filtered: unknown[] = [];
    const count = Math.min(a.length, b.length);

    for (let i = 0; i < count; ++i) {
      const value = a[i];
      const subset = b[i];

      // On regexp references, keep value as it to avoid loosing pattern and flags
      if (value instanceof RegExp) {
        filtered.push(value);
        continue;
      }

      // On array references, build a filtered array and filter nested objects inside
      if (Array.isArray(value) && Array.isArray(subset)) {
        filtered.push(filterArray(value, subset));
        continue;
      }

      // On nested objects references, build a filtered object recursively
      if (isObject(value) && isObject(subset)) {
        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
        if ((value instanceof Map) && (subset instanceof Map)) {
          const map = new Map(
            [...value].filter(([k]) => subset.has(k))
              .map(([k, v]) => {
                const v2 = subset.get(k);
                if (isObject(v) && isObject(v2)) {
                  return [k, filterObject(v as loose, v2 as loose)];
                }

                return [k, v];
              }),
          );
          filtered.push(map);
          continue;
        }

        // When both operands are set, build a filtered set with common values
        if ((value instanceof Set) && (subset instanceof Set)) {
          filtered.push(value.intersection(subset));
          continue;
        }

        filtered.push(filterObject(value as loose, subset as loose));
        continue;
      }

      filtered.push(value);
    }

    return filtered;
  }
}
