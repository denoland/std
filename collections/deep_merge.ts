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
  Options extends DeepMergeOptions,
>(
  record: T,
  other: U,
  options?: Options,
): DeepMerge<T, U, Options>;

export function deepMerge<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>,
  Options extends DeepMergeOptions,
>(
  record: T,
  other: U,
  options?: Options,
): DeepMerge<T, U, Options> {
  // Extract options
  const {
    arrays = "merge",
    maps = "merge",
    sets = "merge",
    includeNonEnumerable = false,
  } = options ?? {};

  // Clone left operand to avoid performing mutations in-place
  type Result = DeepMerge<T, U, Options>;
  const result = clone(record, { includeNonEnumerable }) as Result;

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
 * anymore to those of target record
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

  // Build cloned record, creating new data structure when needed
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
 * Builtins that look like objects, null and user defined classes
 * are not considered mergeable (it means that reference will be copied)
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

/** Merging strategy */
export type MergingStrategy = "replace" | "merge";

/** Deep merge options */
export type DeepMergeOptions = {
  /** Merging strategy for arrays */
  arrays?: MergingStrategy;
  /** Merging strategy for Maps */
  maps?: MergingStrategy;
  /** Merging strategy for Sets */
  sets?: MergingStrategy;
  /** Whether to include non enumerable properties */
  includeNonEnumerable?: boolean;
};

/**
 * How does recursive typing works ?
 *
 * Deep merging process is handled through `DeepMerge<T, U, Options>` type.
 * If both T and U are Records, we recursively merge them,
 * else we treat them as primitives.
 *
 * Merging process is handled through `Merge<T, U>` type, in which
 * we remove all maps, sets, arrays and records so we can handle them
 * separately depending on merging strategy:
 *
 *    Merge<
 *      {foo: string},
 *      {bar: string, baz: Set<unknown>},
 *    > // "foo" and "bar" will be handled with `MergeRightOmitComplexs`
 *      // "baz" will be handled with `MergeAll*` type
 *
 * `MergeRightOmitComplexs<T, U>` will do the above: all T's
 * exclusive keys will be kept, though common ones with U will have their
 * typing overriden instead:
 *
 *    MergeRightOmitComplexs<
 *      {foo: string, baz: number},
 *      {foo: boolean, bar: string}
 *    > // {baz: number, foo: boolean, bar: string}
 *      // "baz" was kept from T
 *      // "foo" was overriden by U's typing
 *      // "bar" was added from U
 *
 * For Maps, Arrays, Sets and Records, we use `MergeAll*<T, U>` utilitary
 * types. They will extract revelant data structure from both T and U
 * (providing that both have same data data structure, except for typing).
 *
 * From these, `*ValueType<T>` will extract values (and keys) types to be
 * able to create a new data structure with an unioned typing from both
 * data structure of T and U:
 *
 *    MergeAllSets<
 *      {foo: Set<number>},
 *      {foo: Set<string>}
 *    > // `SetValueType` will extract "number" for T
 *      // `SetValueType` will extract "string" for U
 *      // `MergeAllSets` will infer type as Set<number|string>
 *      // Process is similar for Maps, Arrays, and Sets
 *
 * `DeepMerge<T, U, Options>` is taking a third argument to be handle to
 * infer final typing dependending on merging strategy:
 *
 *    & (Options extends { sets: "replace" } ? PartialByType<U, Set<unknown>>
 *      : MergeAllSets<T, U>)
 *
 * In the above line, if "Options" have its merging strategy for Sets set to
 * "replace", instead of performing merging of Sets type, it will take the
 * typing from right operand (U) instead, effectively replacing the typing.
 *
 * An additional note, we use `ExpandRecursively<T>` utilitary type to expand
 * the resulting typing and hide all the typing logic of deep merging so it is
 * more user friendly.
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

/** Merge all records types definitions from keys present in both objects */
type MergeAllRecords<
  T,
  U,
  Options,
  X = PartialByType<T, Record<PropertyKey, unknown>>,
  Y = PartialByType<U, Record<PropertyKey, unknown>>,
  Z = {
    [K in keyof X & keyof Y]: DeepMerge<X[K], Y[K], Options>;
  },
> = Z;

/** Exclude map, sets and array from type */
type OmitComplexs<T> = Omit<
  T,
  keyof PartialByType<
    T,
    | Map<unknown, unknown>
    | Set<unknown>
    | Array<unknown>
    | Record<PropertyKey, unknown>
  >
>;

/** Object with keys in either T or U but not in both */
type ObjectXorKeys<
  T,
  U,
  X = Omit<T, keyof U> & Omit<U, keyof T>,
  Y = { [K in keyof X]: X[K] },
> = Y;

/** Merge two objects, with left precedence */
type MergeRightOmitComplexs<
  T,
  U,
  X = ObjectXorKeys<T, U> & OmitComplexs<{ [K in keyof U]: U[K] }>,
> = X;

/** Merge two objects */
type Merge<
  T,
  U,
  Options,
  X =
    & MergeRightOmitComplexs<T, U>
    & MergeAllRecords<T, U, Options>
    & (Options extends { sets: "replace" } ? PartialByType<U, Set<unknown>>
      : MergeAllSets<T, U>)
    & (Options extends { arrays: "replace" } ? PartialByType<U, Array<unknown>>
      : MergeAllArrays<T, U>)
    & (Options extends { maps: "replace" }
      ? PartialByType<U, Map<unknown, unknown>>
      : MergeAllMaps<T, U>),
> = ExpandRecursively<X>;

/** Merge deeply two objects */
export type DeepMerge<
  T,
  U,
  Options = Record<string, MergingStrategy>,
> =
  // Handle objects
  [T, U] extends [Record<PropertyKey, unknown>, Record<PropertyKey, unknown>]
    ? Merge<T, U, Options>
    : // Handle primitives
    T | U;
