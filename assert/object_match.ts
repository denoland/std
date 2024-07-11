// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertEquals } from "./equals.ts";

type loose = Record<PropertyKey, unknown>;

/**
 * Make an assertion that `expected` object is a subset of `actual` object,
 * deeply. If not, then throw.
 *
 * @example Usage
 * ```ts no-eval
 * import { assertObjectMatch } from "@std/assert";
 *
 * assertObjectMatch({ foo: "bar" }, { foo: "bar" }); // Doesn't throw
 * assertObjectMatch({ foo: "bar" }, { foo: "baz" }); // Throws
 * ```
 *
 * @example Usage with nested objects
 * ```ts no-eval
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

function filter(a: loose, b: loose): loose {
  const seen = new WeakMap();

  function filterObj(a: loose, b: loose): loose {
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
    const keysA = [
      ...Object.getOwnPropertyNames(a),
      ...Object.getOwnPropertySymbols(a),
    ];
    const keysB = [
      ...Object.getOwnPropertyNames(b),
      ...Object.getOwnPropertySymbols(b),
    ];
    const entries = keysA
      .filter((key) => keysB.includes(key))
      .map((key) => [key, a[key as string]]) as Array<[string, unknown]>;

    if (entries.length === 0 && keysB.length) {
      // If no keys or symbols are present in both actual and expected, and expected is not empty,
      // returns keys and symbols in actual
      for (const key of keysA) {
        filtered[key] = a[key];
      }
    } else {
      for (const [key, value] of entries) {
        // On array references, build a filtered array and filter nested objects inside
        if (Array.isArray(value)) {
          const subset = (b as loose)[key];
          if (Array.isArray(subset)) {
            filtered[key] = filterArray(value, subset);
            continue;
          }
        } // On regexp references, keep value as it to avoid loosing pattern and flags
        else if (value instanceof RegExp) {
          filtered[key] = value;
          continue;
        } // On nested objects references, build a filtered object recursively
        else if (typeof value === "object" && value !== null) {
          const subset = (b as loose)[key];
          if ((typeof subset === "object") && subset !== null) {
            // When both operands are maps, build a filtered map with
            // common keys and filter nested objects inside
            if ((value instanceof Map) && (subset instanceof Map)) {
              filtered[key] = new Map(
                [...value].filter(([k]) => subset.has(k)).map((
                  [k, v],
                ) => [
                  k,
                  typeof v === "object" ? filterObj(v, subset.get(k)) : v,
                ]),
              );
              continue;
            }
            // When both operands are set, build a filtered set with common values
            if ((value instanceof Set) && (subset instanceof Set)) {
              filtered[key] = new Set([...value].filter((v) => subset.has(v)));
              continue;
            }
            filtered[key] = filterObj(value as loose, subset as loose);
            continue;
          }
        }
        filtered[key] = value;
      }
    }
    return filtered;
  }

  function filterArray(a: unknown[], b: unknown[]): unknown[] {
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

    const filtered: unknown[] = [];
    const length = Math.min(a.length, b.length);

    for (let i = 0; i < length; ++i) {
      const elementA = a[i];
      const elementB = b[i];

      if (Array.isArray(elementA) && Array.isArray(elementB)) {
        filtered.push(
          filterArray(elementA as unknown[], elementB as unknown[]),
        );
        continue;
      } // On regexp references, keep value as it to avoid loosing pattern and flags
      else if (elementA instanceof RegExp) {
        filtered.push(elementA);
        continue;
      } // On objects references, build a filtered object recursively
      else if (
        (typeof elementA === "object" && elementA !== null) &&
        (typeof elementB === "object" && elementB !== null)
      ) {
        // When both operands are maps, build a filtered map with common keys and filter nested objects inside
        if ((elementA instanceof Map) && (elementB instanceof Map)) {
          const map = new Map(
            [...elementA].filter(([k]) => elementB.has(k)).map((
              [k, v],
            ) => [
              k,
              typeof v === "object" ? filterObj(v, elementB.get(k)) : v,
            ]),
          );
          filtered.push(map);
          continue;
        }
        // When both operands are set, build a filtered set with common values
        if ((elementA instanceof Set) && (elementB instanceof Set)) {
          const set = new Set([...elementA].filter((v) => elementB.has(v)));
          filtered.push(set);
          continue;
        }
        filtered.push(filterObj(elementA as loose, elementB as loose));
        continue;
      }
      filtered.push(elementA);
    }
    return filtered;
  }

  return filterObj(a, b);
}
