// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given reducer to each group in the given Grouping, returning the results together with the respective group keys
 *
 * ```ts
 * import { reduceGroups } from "./reduce_groups.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const votes = {
 *     'Woody': [ 2, 3, 1, 4 ],
 *     'Buzz': [ 5, 9 ],
 * }
 * const totalVotes = reduceGroups(votes, (sum, it) => sum + it, 0)
 *
 * assertEquals(totalVotes, {
 *     'Woody': 10,
 *     'Buzz': 14,
 * })
 * ```
 */
export function reduceGroups<T, A>(
  record: Readonly<Record<string, Array<T>>>,
  reducer: (accumulator: A, current: T) => A,
  initialValue: A,
): Record<string, A> {
  const result: Record<string, A> = {};

  for (const [key, values] of Object.entries(record)) {
    result[key] = values.reduce(reducer, initialValue);
  }

  return result;
}
