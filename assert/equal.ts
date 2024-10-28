// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

type KeyedCollection = Set<unknown> | Map<unknown, unknown>;
function isKeyedCollection(x: unknown): x is KeyedCollection {
  return x instanceof Set || x instanceof Map;
}

function constructorsEqual(a: object, b: object) {
  return a.constructor === b.constructor ||
    a.constructor === Object && !b.constructor ||
    !a.constructor && b.constructor === Object;
}

function isBasicObject(obj: object) {
  const proto = Object.getPrototypeOf(obj);
  return proto == null || proto === Object.prototype ||
    proto === Array.prototype;
}

// Slightly faster than Reflect.ownKeys in V8 as of 12.9.202.13-rusty (2024-10-28)
function ownKeys(obj: object) {
  return [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];
}

function getKeysDeep(obj: object) {
  const keys = new Set<string | symbol>();

  while (obj !== Object.prototype && obj !== Array.prototype && obj != null) {
    for (const key of ownKeys(obj)) {
      keys.add(key);
    }
    obj = Object.getPrototypeOf(obj);
  }

  keys.delete("constructor");

  return keys;
}

// Stub the `Temporal` classes in case we don't have access to the Temporal API in current env
class NeverInstanceOf {
  constructor() {
    throw new Error("cannot be instantiated");
  }
}
const Temporal = globalThis.Temporal ?? new Proxy({}, {
  get(_) {
    return NeverInstanceOf;
  },
});

/** A non-exhaustive list of classes that can be accurately fast-path compared with `String(instance)` */
const stringComparables = [
  ...new Set([
    Intl.Locale,
    RegExp,
    Temporal.Duration,
    Temporal.Instant,
    Temporal.PlainDate,
    Temporal.PlainDateTime,
    Temporal.PlainTime,
    Temporal.PlainYearMonth,
    Temporal.PlainMonthDay,
    Temporal.ZonedDateTime,
    URL,
    URLSearchParams,
  ]),
];

function isPrimitive(x: unknown) {
  return typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "boolean" ||
    typeof x === "bigint" ||
    typeof x === "symbol" ||
    x == null;
}

/** Check both strict equality (`0 == -0`) and `Object.is` (`NaN == NaN`) */
function sameValueZero(a: unknown, b: unknown) {
  return a === b || Object.is(a, b);
}

/**
 * Deep equality comparison used in assertions.
 *
 * @param c The actual value
 * @param d The expected value
 * @returns `true` if the values are deeply equal, `false` otherwise
 *
 * @example Usage
 * ```ts
 * import { equal } from "@std/assert/equal";
 *
 * equal({ foo: "bar" }, { foo: "bar" }); // Returns `true`
 * equal({ foo: "bar" }, { foo: "baz" }); // Returns `false`
 * ```
 */
export function equal(c: unknown, d: unknown): boolean {
  const seen = new Map();
  return (function compare(a: unknown, b: unknown): boolean {
    if (sameValueZero(a, b)) return true;
    if (isPrimitive(a) || isPrimitive(b)) return false;

    if (a instanceof Date && b instanceof Date) {
      return sameValueZero(a.getTime(), b.getTime());
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (!constructorsEqual(a, b)) {
        return false;
      }
      if (a instanceof WeakMap || b instanceof WeakMap) {
        if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
        throw new TypeError("cannot compare WeakMap instances");
      }
      if (a instanceof WeakSet || b instanceof WeakSet) {
        if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
        throw new TypeError("cannot compare WeakSet instances");
      }
      if (a instanceof WeakRef || b instanceof WeakRef) {
        if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
        return compare(a.deref(), b.deref());
      }
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }
      seen.set(a, b);
      if (isKeyedCollection(a) && isKeyedCollection(b)) {
        if (a.size !== b.size) {
          return false;
        }

        const aKeys = [...a.keys()];
        const primitiveKeysFastPath = aKeys.every(isPrimitive);
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

      let keys: Iterable<string | symbol>;

      if (isBasicObject(a)) {
        keys = ownKeys({ ...a, ...b });
      } else if (stringComparables.some((Ctor) => a instanceof Ctor)) {
        return String(a) === String(b);
      } else {
        keys = getKeysDeep(a).union(getKeysDeep(b));
      }

      for (const key of keys) {
        type Key = keyof typeof a;
        if (!compare(a[key as Key], b[key as Key])) {
          return false;
        }
        if (((key in a) && (!(key in b))) || ((key in b) && (!(key in a)))) {
          return false;
        }
      }
      return true;
    }
    return false;
  })(c, d);
}
