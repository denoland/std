// Copyright 2018-2025 the Deno authors. MIT license.

// This file is copied from `std/assert`.

import type { EqualOptions } from "./_types.ts";
import { AsymmetricMatcher } from "./_asymmetric_matchers.ts";

type KeyedCollection = Set<unknown> | Map<unknown, unknown>;
function isKeyedCollection(x: unknown): x is KeyedCollection {
  return x instanceof Set || x instanceof Map;
}

function constructorsEqual(a: object, b: object) {
  return a.constructor === b.constructor ||
    a.constructor === Object && !b.constructor ||
    !a.constructor && b.constructor === Object;
}

function asymmetricEqual(a: unknown, b: unknown) {
  const asymmetricA = a instanceof AsymmetricMatcher;
  const asymmetricB = b instanceof AsymmetricMatcher;

  if (asymmetricA && asymmetricB) {
    return undefined;
  }

  if (asymmetricA) {
    return a.equals(b);
  }

  if (asymmetricB) {
    return b.equals(a);
  }
}

/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 * @param options for the equality check
 */
export function equal(c: unknown, d: unknown, options?: EqualOptions): boolean {
  const { customTesters = [], strictCheck } = options ?? {};
  const seen = new Map();

  return (function compare(a: unknown, b: unknown): boolean {
    const asymmetric = asymmetricEqual(a, b);
    if (asymmetric !== undefined) {
      return asymmetric;
    }

    if (customTesters?.length) {
      for (const customTester of customTesters) {
        const testContext = {
          equal,
        };
        const pass = customTester.call(testContext, a, b, customTesters);
        if (pass !== undefined) {
          return pass;
        }
      }
    }

    // Have to render RegExp & Date for string comparison
    // unless it's mistreated as object
    if (
      a &&
      b &&
      ((a instanceof RegExp && b instanceof RegExp) ||
        (a instanceof URL && b instanceof URL))
    ) {
      return String(a) === String(b);
    }

    if (a instanceof Date && b instanceof Date) {
      const aTime = a.getTime();
      const bTime = b.getTime();
      // Check for NaN equality manually since NaN is not
      // equal to itself.
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return true;
      }
      return aTime === bTime;
    }
    if (a instanceof Error && b instanceof Error) {
      return a.message === b.message;
    }
    if (typeof a === "number" && typeof b === "number") {
      return Number.isNaN(a) && Number.isNaN(b) || a === b;
    }
    if (a === null || b === null) {
      return a === b;
    }
    const className = Object.prototype.toString.call(a);
    if (className !== Object.prototype.toString.call(b)) {
      return false;
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (strictCheck && a && b && !constructorsEqual(a, b)) {
        return false;
      }
      if (a instanceof WeakMap || b instanceof WeakMap) {
        if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
        throw new TypeError("Cannot compare WeakMap instances");
      }
      if (a instanceof WeakSet || b instanceof WeakSet) {
        if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
        throw new TypeError("Cannot compare WeakSet instances");
      }
      if (seen.get(a) === b) {
        return true;
      }

      const aKeys = Object.keys(a ?? {});
      const bKeys = Object.keys(b ?? {});
      let aLen = aKeys.length;
      let bLen = bKeys.length;

      if (strictCheck && aLen !== bLen) {
        return false;
      }

      if (!strictCheck) {
        if (aLen > 0) {
          for (let i = 0; i < aKeys.length; i += 1) {
            const key = aKeys[i]!;
            if (
              (key in a) && (a[key as keyof typeof a] === undefined) &&
              !(key in b)
            ) {
              aLen -= 1;
            }
          }
        }

        if (bLen > 0) {
          for (let i = 0; i < bKeys.length; i += 1) {
            const key = bKeys[i]!;
            if (
              (key in b) && (b[key as keyof typeof b] === undefined) &&
              !(key in a)
            ) {
              bLen -= 1;
            }
          }
        }
      }

      seen.set(a, b);
      if (isKeyedCollection(a) && isKeyedCollection(b)) {
        if (a.size !== b.size) {
          return false;
        }

        const aKeys = [...a.keys()];
        const primitiveKeysFastPath = aKeys.every((k) => {
          return typeof k === "string" ||
            typeof k === "number" ||
            typeof k === "boolean" ||
            typeof k === "bigint" ||
            typeof k === "symbol" ||
            k == null;
        });
        if (primitiveKeysFastPath) {
          if (a instanceof Set) {
            return a.symmetricDifference(b).size === 0;
          }

          for (const key of aKeys) {
            if (
              !b.has(key) ||
              !compare(a.get(key), (b as Map<unknown, unknown>).get(key))
            ) {
              return false;
            }
          }
          return true;
        }

        let unmatchedEntries = a.size;

        for (const [aKey, aValue] of a.entries()) {
          for (const [bKey, bValue] of b.entries()) {
            /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */

            if (!compare(aKey, bKey)) continue;

            if (
              (aKey === aValue && bKey === bValue) ||
              (compare(aValue, bValue))
            ) {
              unmatchedEntries--;
              break;
            }
          }
        }

        return unmatchedEntries === 0;
      }
      const merged = { ...a, ...b };
      for (
        const key of [
          ...Object.getOwnPropertyNames(merged),
          ...Object.getOwnPropertySymbols(merged),
        ]
      ) {
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
        if (
          ((key in a) && (a[key as Key] !== undefined) && (!(key in b))) ||
          ((key in b) && (b[key as Key] !== undefined) && (!(key in a)))
        ) {
          return false;
        }
      }
      if (a instanceof WeakRef || b instanceof WeakRef) {
        if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
        return compare(a.deref(), b.deref());
      }
      return true;
    }
    return false;
  })(c, d);
}
