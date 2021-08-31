// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { filterInPlace } from "./_utils.ts";

/**
 * Returns all distinct elements that appear at least once in each of the given arrays
 *
 * Example:
 *
 * ```ts
 * import { intersect } from "./intersect.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const lisaInterests = [ 'Cooking', 'Music', 'Hiking' ]
 * const kimInterests = [ 'Music', 'Tennis', 'Cooking' ]
 * const commonInterests = intersect(lisaInterests, kimInterests)
 *
 * assertEquals(commonInterests, [ 'Cooking', 'Music' ])
 * ```
 */
export function intersect<T>(...arrays: (readonly T[])[]): T[] {
  const [originalHead, ...tail] = arrays;
  const head = [...new Set(originalHead)];
  const tailSets = tail.map((it) => new Set(it));

  for (const set of tailSets) {
    filterInPlace(head, (it) => set.has(it));
    if (head.length === 0) return head;
  }

  return head;
}
