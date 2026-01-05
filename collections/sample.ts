// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns a random element from the given iterable.
 *
 * @typeParam T The type of the elements in the iterable.
 *
 * @param iterable The iterable to sample from.
 *
 * @returns A random element from the given iterable, or `undefined` if the iterable has no elements.
 *
 * @example Basic usage
 * ```ts
 * import { sample } from "@std/collections/sample";
 * import { assertArrayIncludes } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const random = sample(numbers);
 *
 * assertArrayIncludes(numbers, [random]);
 * ```
 */
export function sample<T>(iterable: Iterable<T>): T | undefined {
  let array: readonly T[];
  if (Array.isArray(iterable)) {
    array = iterable;
  } else {
    array = Array.from(iterable);
  }
  const length: number = array.length;
  if (length === 0) {
    return undefined;
  }
  const randomIndex = Math.floor(Math.random() * length);
  return array[randomIndex];
}
