// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns the arithmetic mode(s) of the numbers in the given collection
 *
 * Example:
 *
 * ```ts
 * const numbers = [ 4, 2, 7, 4 ]
 * assertEquals(mode(numbers), 4)
 * ```
 */
export function mode(collection: Array<number>): Set<number> | undefined {
  if (collection.length === 0) {
    return undefined;
  }

  const counter: Record<number, number> = {};
  counter[collection[0]] = 1;
  const maxes = new Set([collection[0]]);
  let maxCount = 1;

  for (let i = 1; i < collection.length; i++) {
    const number = collection[i];
    counter[number] = (counter[number] || 0) + 1;

    if (counter[number] === maxCount) {
      maxes.add(number);
    } else if (counter[number] > maxCount) {
      maxes.clear();
      maxes.add(number);
      maxCount = counter[number];
    }
  }

  return maxes;
}
