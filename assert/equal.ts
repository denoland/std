// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

type KeyedCollection = Set<unknown> | Map<unknown, unknown>;
function isKeyedCollection(x: unknown): x is KeyedCollection {
  return x instanceof Set || x instanceof Map;
}

function prototypesEqual(a: object, b: object) {
  const pa = Object.getPrototypeOf(a);
  const pb = Object.getPrototypeOf(b);
  return pa === pb ||
    pa === Object.prototype && pb === null ||
    pa === null && pb === Object.prototype;
}

function isBasicObjectOrArray(obj: object) {
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype ||
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

  return keys;
}

// deno-lint-ignore no-explicit-any
const Temporal = (globalThis as any).Temporal ?? Object.create(null);

/** A non-exhaustive list of prototypes that can be accurately fast-path compared with `String(instance)` */
const stringComparablePrototypes = new Set<unknown>(
  [
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
  ].filter((x) => x != null).map((x) => x.prototype),
);

function isPrimitive(x: unknown) {
  return typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "boolean" ||
    typeof x === "bigint" ||
    typeof x === "symbol" ||
    x == null;
}

type TypedArray = Pick<Uint8Array | BigUint64Array, "length" | number>;
const TypedArray = Object.getPrototypeOf(Uint8Array);
function compareTypedArrays(a: TypedArray, b: TypedArray) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (!sameValueZero(a[i], b[i])) return false;
  }
  return true;
}

/** Check both strict equality (`0 == -0`) and `Object.is` (`NaN == NaN`) */
function sameValueZero(a: unknown, b: unknown) {
  return a === b || Object.is(a, b);
}

/**
 * Deep equality comparison used in assertions.
 *
 * @param a The actual value
 * @param b The expected value
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
export function equal(a: unknown, b: unknown): boolean {
  const seen = new Map<unknown, unknown>();
  return (function compare(a: unknown, b: unknown): boolean {
    if (sameValueZero(a, b)) return true;
    if (isPrimitive(a) || isPrimitive(b)) return false;

    if (a instanceof Date && b instanceof Date) {
      return Object.is(a.getTime(), b.getTime());
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (!prototypesEqual(a, b)) {
        return false;
      }
      if (a instanceof TypedArray) {
        return compareTypedArrays(a as TypedArray, b as TypedArray);
      }
      if (
        a instanceof ArrayBuffer ||
        (globalThis.SharedArrayBuffer && a instanceof SharedArrayBuffer)
      ) {
        return compareTypedArrays(
          new Uint8Array(a),
          new Uint8Array(b as ArrayBuffer | SharedArrayBuffer),
        );
      }
      if (a instanceof WeakMap) {
        throw new TypeError("Cannot compare WeakMap instances");
      }
      if (a instanceof WeakSet) {
        throw new TypeError("Cannot compare WeakSet instances");
      }
      if (a instanceof WeakRef) {
        return compare(a.deref(), (b as WeakRef<WeakKey>).deref());
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

      if (isBasicObjectOrArray(a)) {
        // fast path
        keys = ownKeys({ ...a, ...b });
      } else if (stringComparablePrototypes.has(Object.getPrototypeOf(a))) {
        // medium path
        return String(a) === String(b);
      } else {
        // slow path
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
  })(a, b);
}
