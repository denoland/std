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
  type Result = DeepMerge<T, U>;
  const result = clone(record as Result, { includeNonEnumerable });

  // Extract property and symbols
  const keys = [
    ...Object.getOwnPropertyNames(other),
    ...Object.getOwnPropertySymbols(other),
  ].filter((key) =>
    includeNonEnumerable || other.propertyIsEnumerable(key)
  ) as Array<keyof Result>;

  // Iterate through each key of other object and use correct merging strategy
  for (const key of keys) {
    const a = result[key] as Result[typeof key],
      b = other[key] as Result[typeof key];

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
      result[key] = deepMerge(a, b) as Result[typeof key];
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
 * Recursive typings
 *
 * Deep merging process is handled through `DeepMerge<T, U>` type.
 * If both T and U are Records, we recursively merge them,
 * else we treat them as primitives
 *
 * In merging process, handled through `Merge<T, U>` type,
 * We remove all maps, sets and arrays as we'll handle them differently.
 *
 *    Merge<
 *      {foo: string},
 *      {bar: string, baz: Set<unknown>},
 *    > // "foo" and "bar" will be handled with `MergeRightOmitCollections`
 *      // "baz" will be handled with `MergeAll*`
 *
 * The `MergeRightOmitCollections<T, U>` will do so, while keeping T's
 * exclusive keys, overriding common ones by U's typing instead and
 * adding U's exclusive keys:
 *
 *    MergeRightOmitCollections<
 *      {foo: string, baz: number},
 *      {foo: boolean, bar: string}
 *    > // {baz: number, foo: boolean, bar: string}
 *      // "baz" was kept from T
 *      // "foo" was overriden by U's typing
 *      // "bar" was added from U
 *
 * Then, for Maps, Arrays and Sets, we use `MergeAll*<T, U>` types.
 * They will extract given collections from both T and U (providing that
 * both have a collection for a specific key), retrieve each collection
 * values types (and key types for maps) using `*ValueType<T>`.
 * From extracted values (and keys) types, a new collection with union
 * typing is made.
 *
 *    MergeAllSets<
 *      {foo: Set<number>},
 *      {foo: Set<string>}
 *    > // `SetValueType` will extract "number" for T
 *      // `SetValueType` will extract "string" for U
 *      // `MergeAllSets` will infer type as Set<number|string>
 *      // Process is similar for Maps, Arrays, and Sets
 *
 * This should cover most cases.
 */

/** Force intellisense to expand the typing to hide merging typings */
type ExpandRecursively<T> = T extends Record<PropertyKey, unknown>
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

/** Filter of keys matching a given type */
type PartialByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/** Get set values type */
type SetValueType<T> = T extends Set<infer V> ? V : never;

/** Merge all sets types definitions from keys present in both objects */
type MergeAllSets<
  T,
  U,
  X = PartialByType<T, Set<unknown>>,
  Y = PartialByType<U, Set<unknown>>,
  Z = {
    [K in keyof X & keyof Y]: Set<SetValueType<X[K]> | SetValueType<Y[K]>>;
  },
> = Z;

/** Get array values type */
type ArrayValueType<T> = T extends Array<infer V> ? V : never;

/** Merge all sets types definitions from keys present in both objects */
type MergeAllArrays<
  T,
  U,
  X = PartialByType<T, Array<unknown>>,
  Y = PartialByType<U, Array<unknown>>,
  Z = {
    [K in keyof X & keyof Y]: Array<
      ArrayValueType<X[K]> | ArrayValueType<Y[K]>
    >;
  },
> = Z;

/** Get map values types */
type MapKeyType<T> = T extends Map<infer K, unknown> ? K : never;

/** Get map values types */
type MapValueType<T> = T extends Map<unknown, infer V> ? V : never;

/** Merge all sets types definitions from keys present in both objects */
type MergeAllMaps<
  T,
  U,
  X = PartialByType<T, Map<unknown, unknown>>,
  Y = PartialByType<U, Map<unknown, unknown>>,
  Z = {
    [K in keyof X & keyof Y]: Map<
      MapKeyType<X[K]> | MapKeyType<Y[K]>,
      MapValueType<X[K]> | MapValueType<Y[K]>
    >;
  },
> = Z;

/** Exclude map, sets and array from type */
type OmitCollections<T> = Omit<
  T,
  keyof PartialByType<T, Map<unknown, unknown> | Set<unknown> | Array<unknown>>
>;

/** Object with keys in either T or U but not in both */
type ObjectXorKeys<
  T,
  U,
  X = Omit<T, keyof U> & Omit<U, keyof T>,
  Y = { [K in keyof X]: X[K] },
> = Y;

/** Merge two objects, with left precedence */
type MergeRightOmitCollections<
  T,
  U,
  X = ObjectXorKeys<T, U> & OmitCollections<{ [K in keyof U]: U[K] }>,
> = X;

/** Merge two objects */
type Merge<
  T,
  U,
  X =
    & MergeRightOmitCollections<T, U>
    & MergeAllSets<T, U>
    & MergeAllArrays<T, U>
    & MergeAllMaps<T, U>,
> = ExpandRecursively<X>;

/** Merge deeply two objects (inspired by Jakub Švehla's solution (@Svehla)) */
export type DeepMerge<T, U> =
  // Handle objects
  [T, U] extends [Record<PropertyKey, unknown>, Record<PropertyKey, unknown>]
    ? Merge<T, U>
    : // Handle primitives
    T | U;
