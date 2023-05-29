// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { minOf } from "./min_of.ts";

/**
 * Builds N-tuples of elements from the given N arrays with matching indices,
 * stopping when the smallest array's end is reached.
 *
 * @example
 * ```ts
 * import { zip } from "https://deno.land/std@$STD_VERSION/collections/zip.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [1, 2, 3, 4];
 * const letters = ["a", "b", "c", "d"];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(
 *   pairs,
 *   [
 *     [1, "a"],
 *     [2, "b"],
 *     [3, "c"],
 *     [4, "d"],
 *   ],
 * );
 * ```
 */
export function zip<const T extends Readonly2DArray>(
  ...arrays: T
): Zip<T> {
  const minLength = minOf(arrays, (it) => it.length) ?? 0;

  const ret: unknown[][] = new Array(minLength);

  for (let i = 0; i < minLength; i += 1) {
    const arr = arrays.map((it) => it[i]);
    ret[i] = arr;
  }

  return ret as Zip<T>;
}

/**
 * zip the array.
 * If all the arguments consist of tuples, the length can be determined, so a tuple is returned.
 * If the length is undetermined, adjust for an appropriate return type.
 */
export type Zip<M extends Readonly2DArray> =
  IncludesNonTuple<Writeable2DArray<M>> extends true
    ? UnknownLengthTuple<Transpose<M, ShortestArray<Writeable2DArray<M>>>>
    : Transpose<M, ShortestArray<Writeable2DArray<M>>>;

// Note: inspired by https://github.com/type-challenges/type-challenges/issues/25297
/**
 * Transpose the array.
 * If the array lengths vary, it will be aligned to the shortest array.
 */
type Transpose<Target extends Readonly2DArray, ShortestArray> = Target extends
  Target ? {
    -readonly [X in keyof ShortestArray]: {
      -readonly [Y in keyof Target]: IsNotTuple<Target[Y]> extends true
        ? Target[Y][number]
        : X extends IndexOf<Target[Y]> ? Target[Y][X]
        : never;
    };
  }
  : never;

/** find the shortest Array. */
type ShortestArray<T extends unknown[][]> = IsNotTuple<T> extends true
  ? T[number]
  : T extends [infer A] ? A
  : T extends [infer First extends unknown[], ...infer Rest extends unknown[][]]
    ? Shorter<First, ShortestArray<Rest>> extends false ? ShortestArray<Rest>
    : First
  : [];

/** whether the length of A is less than the length of B. */
// Note: inspired by https://github.com/type-challenges/type-challenges/issues/14098
// Recurse while decreasing the length of the array by 1, and the one that reaches 0 first is the shortest.
type Shorter<A extends unknown[], B extends unknown[]> = IsNotTuple<A> extends
  true ? false : IsNotTuple<B> extends true ? true : A extends [] ? true
: B extends [] ? false
: A extends [unknown, ...infer Ra]
  ? B extends [unknown, ...infer Rb] ? Shorter<Ra, Rb> : never
: never;

/**
 * Determines whether everything consists of tuples or includes non-tuples (arrays).
 *
 * ```ts, ignore
 * type Tuple_ = [0, 1, 2];
 * type Array_ = string[];
 *
 * IncludesNonTuple<[Tuple_, Tuple_, Tuple_]>; //=> false
 * IncludesNonTuple<[Tuple_, Tuple_, Array_]>; //=> true
 * IncludesNonTuple<[Tuple_, Array_, Tuple_]>; //=> true
 * ```
 */
type IncludesNonTuple<T extends unknown[][]> = IsNotTuple<T> extends true
  ? IsNotTuple<T[number]>
  : T extends [] ? false
  : T extends [infer First extends unknown[], ...infer Rest extends unknown[][]]
    ? IsNotTuple<First> extends true ? true
    : IncludesNonTuple<Rest>
  : never;

/**
 * Creates a union type consisting of tuples of length shorter than the given tuple.
 *
 * ```ts, ignore
 * UnknownLengthTuple<[]>;        //=> []
 * UnknownLengthTuple<[0]>;       //=> [] | [0]
 * UnknownLengthTuple<[0, 1]>;    //=> [] | [0] | [0, 1]
 * UnknownLengthTuple<[0, 1, 2]>; //=> [] | [0] | [0, 1] | [0, 1, 2]
 * ```
 */
type UnknownLengthTuple<T> = IsNotTuple<T> extends true ? T
  : T extends [...infer Rest, infer _Last] ? T | UnknownLengthTuple<Rest>
  : [];

/**
 * Like keyof, but only retrieves array or tuple indices.
 *
 * ```ts, ignore
 * IndexOf<number[]>;                    //=> number
 * IndexOf<[0, 1, 2]>;                   //=> number | "0" | "1" | "2"
 * IndexOf<[0, 1, 2] | [0, 1, 2, 3, 4]>; //=> number | "0" | "1" | "2" | "3" | "4"
 * ```
 */
type IndexOf<T> = T extends readonly unknown[]
  ? IsNotTuple<T> extends true ? number
  : { [K in keyof T]: K }[number] | number
  : never;

/**
 * Determines if the given argument is a tuple or something else.
 *
 * ```ts, ignore
 * IsNotTuple<[0, 1, 2]>; //=> false
 * IsNotTuple<number[]>; //=> true
 * ```
 */
type IsNotTuple<T> = T extends readonly unknown[]
  ? number extends T["length"] ? true : false
  : false;

type Readonly2DArray = ReadonlyArray<ReadonlyArray<unknown>>;

/** Make the readonly 2D array type mutable. */
// Note: inspired by https://github.com/microsoft/TypeScript/issues/35660
type Writeable2DArray<T> = {
  -readonly [P in keyof T]: Writable<T[P]>;
};
type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
