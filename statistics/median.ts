// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the arithmetic median of the numbers in the given collection
 *
 * Example:
 *
 * ```ts
 * const numbers = [ 4, 2, 7 ]
 * assertEquals(median(numbers), 4)
 * ```
 */
export function median(collection: Array<number>): number | undefined {
  if (collection.length === 0) {
    return undefined;
  }

  const middle = Math.floor(collection.length / 2);
  const values = Array.from(collection);
  values.sort((a, b) => a - b);

  if (values.length % 2 === 0) {
    return (values[middle] + values[middle - 1]) / 2;
  }

  return values[middle];
}
