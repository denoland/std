// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all distinct elements that appear at least once in each of the given
 * iterables.
 *
 * @typeParam T The type of the elements in the input iterables.
 *
 * @param iterables The iterables to intersect.
 *
 * @returns An array of distinct elements that appear at least once in each of
 * the given iterables.
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
  let set = new Set(iterable);
  if (set.size === 0) return [];
  for (const iterable of otherIterables) {
    set = set.intersection(new Set(iterable));
    if (set.size === 0) return [];
  }
  return [...set];
}
