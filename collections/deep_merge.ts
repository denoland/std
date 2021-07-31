// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Merges the two given Records, recursively merging any nested Records with
 * the second collection overriding the first in case of conflict
 *
 * For arrays, maps and sets, a merging strategy can be specified to either
 * "replace" values, or "merge" them instead.
 * Use "includeNonEnumerable" option to include non enumerable properties too.
 *
 * Example:
 *
 * ```ts
 * import { deepMerge } from "./deep_merge.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const a = {foo: true}
 * const b = {foo: {bar: true}}
 *
 * assertEquals(deepMerge(a, b), {foo: {bar: true}});
 * ```
 */
export function deepMerge<
  T extends Record<PropertyKey, unknown>,
>(
  record: Partial<T>,
  other: Partial<T>,
  options?: DeepMergeOptions,
): T;

export function deepMerge<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>,
>(
  record: T,
  other: U,
  options?: DeepMergeOptions,
): DeepMerge<T, U>;

export function deepMerge<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>,
>(
  record: T,
  other: U,
  {
    arrays = "merge",
    maps = "merge",
    sets = "merge",
    includeNonEnumerable = false,
  }: DeepMergeOptions = {},
): DeepMerge<T, U> {
  // Clone left operand to avoid performing mutations in-place
  type V = DeepMerge<T, U>;
  const result = clone(record as V, { includeNonEnumerable });

  // Extract property and symbols
  const keys = [
    ...Object.getOwnPropertyNames(other),
    ...Object.getOwnPropertySymbols(other),
  ].filter((key) =>
    includeNonEnumerable || other.propertyIsEnumerable(key)
  ) as Array<keyof V>;

  // Iterate through each key of other object and use correct merging strategy
  for (const key of keys) {
    const a = result[key] as V[typeof key], b = other[key] as V[typeof key];

    // Handle arrays
    if ((Array.isArray(a)) && (Array.isArray(b))) {
      if (arrays === "merge") {
        a.push(...b);
      } else {
        result[key] = b;
      }
      continue;
    }

    // Handle maps
    if ((a instanceof Map) && (b instanceof Map)) {
      if (maps === "merge") {
        for (const [k, v] of b.entries()) {
          a.set(k, v);
        }
      } else {
        result[key] = b;
      }
      continue;
    }

    // Handle sets
    if ((a instanceof Set) && (b instanceof Set)) {
      if (sets === "merge") {
        for (const v of b.values()) {
          a.add(v);
        }
      } else {
        result[key] = b;
      }
      continue;
    }

    // Recursively merge mergeable objects
    if (isMergeable(a) && isMergeable(b)) {
      result[key] = deepMerge(a, b) as V[typeof key];
      continue;
    }

    // Override value
    result[key] = b;
  }
  return result;
}

/**
 * Clone a record
 * Arrays, maps, sets and objects are cloned so references doesn't point
 * anymore to those of cloned record
 */
function clone<T extends Record<PropertyKey, unknown>>(
  record: T,
  { includeNonEnumerable = false } = {},
) {
  // Extract property and symbols
  const cloned = {} as T;
  const keys = [
    ...Object.getOwnPropertyNames(record),
    ...Object.getOwnPropertySymbols(record),
  ].filter((key) =>
    includeNonEnumerable || record.propertyIsEnumerable(key)
  ) as Array<keyof T>;

  // Build cloned record
  for (const key of keys) {
    type SameType = T[typeof key];
    const v = record[key];
    if (Array.isArray(v)) {
      cloned[key] = [...v] as SameType;
      continue;
    }
    if (v instanceof Map) {
      cloned[key] = new Map(v) as SameType;
      continue;
    }
    if (v instanceof Set) {
      cloned[key] = new Set(v) as SameType;
      continue;
    }
    if (isMergeable(v)) {
      cloned[key] = clone(v);
      continue;
    }
    cloned[key] = v;
  }

  return cloned;
}

/**
 * Test whether a value is mergeable or not
 * Builtins object like, null and user classes are not considered mergeable
 */
function isMergeable<T extends Record<PropertyKey, unknown>>(
  value: unknown,
): value is T {
  // Ignore null
  if (value === null) {
    return false;
  }
  // Ignore builtins and classes
  if ((typeof value === "object") && ("constructor" in value!)) {
    return Object.getPrototypeOf(value) === Object.prototype;
  }
  return typeof value === "object";
}

/** Deep merge options */
export type DeepMergeOptions = {
  /** Merging strategy for arrays */
  arrays?: "replace" | "merge";
  /** Merging strategy for Maps */
  maps?: "replace" | "merge";
  /** Merging strategy for Sets */
  sets?: "replace" | "merge";
  /** Whether to include non enumerable properties */
  includeNonEnumerable?: boolean;
};

/**
 * DeepMerge typing inspired by Jakub Švehla's solution (@Svehla)
 */

/** Object with keys in either T or U but not in both */
type ObjectXorKeys<
  T,
  U,
  V = Omit<T, keyof U> & Omit<U, keyof T>,
  W = { [K in keyof V]: V[K] },
> = W;

/** Object with keys in both T and U */
type ObjectAndKeys<T, U> = Omit<T | U, keyof ObjectXorKeys<T, U>>;

/** Merge two objects */
type Merge<
  T,
  U,
  V =
    & ObjectXorKeys<T, U>
    & { [K in keyof ObjectAndKeys<T, U>]: DeepMerge<T[K], U[K]> },
  W = { [K in keyof V]: V[K] },
> = W;

/** Merge deeply two objects */
export type DeepMerge<T, U> =
  // Handle objects
  [T, U] extends [{ [key: string]: unknown }, { [key: string]: unknown }]
    ? Merge<T, U>
    : // Handle primitives
    T | U;
