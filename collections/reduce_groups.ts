// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { mapValues } from "./map_values.ts";

/**
 * Applies the given reducer to each group in the given Grouping, returning the
 * results together with the respective group keys.
 *
 * @example
 * ```ts
 * import { reduceGroups } from "https://deno.land/std@$STD_VERSION/collections/reduce_groups.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const votes = {
 *   "Woody": [2, 3, 1, 4],
 *   "Buzz": [5, 9],
 * };
 *
 * const totalVotes = reduceGroups(votes, (sum, it) => sum + it, 0);
 *
 * assertEquals(totalVotes, {
 *   "Woody": 10,
 *   "Buzz": 14,
 * });
 * ```
 */
export function reduceGroups<T, A, K extends string>(
  record: Readonly<Partial<Record<K, Array<T>>>>,
  reducer: (accumulator: A, current: T) => A,
  initialValue: A,
): Partial<Record<K, A>> {
  return mapValues(record, (it) => it.reduce(reducer, initialValue));
}
