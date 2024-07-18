// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns all distinct elements that appear at least once in each of the given
 * arrays.
 *
 * @typeParam T The type of the elements in the input arrays.
 *
 * @param arrays The arrays to intersect.
 *
 * @returns An array of distinct elements that appear at least once in each of
 * the given arrays.
 *
 * @example Basic usage
 * ```ts
 * import { intersect } from "@std/collections/intersect";
 * import { assertEquals } from "@std/assert";
 *
 * const lisaInterests = ["Cooking", "Music", "Hiking"];
 * const kimInterests = ["Music", "Tennis", "Cooking"];
 * const commonInterests = intersect(lisaInterests, kimInterests);
 *
 * assertEquals(commonInterests, ["Cooking", "Music"]);
 * ```
 */
export function intersect<T>(...arrays: (readonly T[])[]): T[] {
  const [array, ...otherArrays] = arrays;
  let set = new Set(array);
  for (const array of otherArrays) {
    set = set.intersection(new Set(array));
    if (set.size === 0) break;
  }
  return [...set];
}
