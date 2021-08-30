// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given aggregator to each group in the given Grouping, returning the results together with the respective group keys
 *
 * ```ts
 * import { aggregateGroups } from "./aggregate_groups.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 * 
 * const foodProperties = {
 *     'Curry': [ 'spicy', 'vegan' ],
 *     'Omelette': [ 'creamy', 'vegetarian' ],
 * }
 * const descriptions = aggregateGroups(foodProperties,
 *     (acc, current, key, first) => {
 *         if (first)
 *             return `${key} is ${current}`
 *
 *         return `${acc} and ${current}`
 *     },
 *     '',
 * )
 *
 * assetEquals(descriptions === {
 *     'Curry': 'Curry is spicy and vegan',
 *     'Omelette': 'Omelette is creamy and vegetarian',
 * })
 * ```
 */
export function aggregateGroups<T, A>(
  record: Record<string, Array<T>>,
  aggregator: (accumulator: A, current: T, key: string, first: boolean) => A,
  initalValue: A,
): Record<string, A> {
  const result: Record<string, A> = {};

  for (const [key, values] of Object.entries(record)) {
    result[key] = values.reduce(
      (accumulator, current, currentIndex) =>
        aggregator(accumulator, current, key, currentIndex === 0),
      initalValue,
    );
  }

  return result;
}
