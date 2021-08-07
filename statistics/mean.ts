// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the arithmetic mean of the numbers in the given collection
 *
 * Example:
 *
 * ```ts
 * const numbers = [ 4, 2, 9 ]
 * assertEquals(mean(numbers), 5)
 * ```
 */
export function mean(collection: Array<number>): number | undefined {
  if (collection.length === 0) {
    return undefined;
  }

  let total = 0;
  for (const number of collection) {
    total += number;
  }

  return total / collection.length;
}
