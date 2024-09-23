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
export function intersect<T>(...iterables: Iterable<T>[]): T[] {
  const [iterable, ...otherIterables] = iterables;
  const set = new Set(iterable);
  if (set.size === 0) {
    return [];
  }
  for (const iterable of otherIterables) {
    const otherSet = new Set(iterable);
    for (const value of set) {
      if (!otherSet.has(value)) {
        set.delete(value);
        if (set.size === 0) {
          break;
        }
      }
    }
  }
  return [...set];
}

export function intersectSetBased<T>(...iterables: Iterable<T>[]): T[] {
  const [iterable, ...otherIterables] = iterables;
  let set = new Set(iterable);
  if (set.size === 0) {
    return [];
  }
  for (const iterable of otherIterables) {
    set = set.intersection(new Set(iterable));
    if (set.size === 0) {
      break;
    }
  }
  return [...set];
}
