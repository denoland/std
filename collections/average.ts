// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns an average value of elements in the array
 *
 * Example:
 *
 * ```ts
 * import { average } from "./average.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const numbers = [5, 6, 7, 8, 9];
 * const avg = average(numbers);
 *
 * assertEquals(avg, 7);
 * ```
 */
export function average(collection: Array<number>): number | undefined {
  if (collection.length === 0) {
    return;
  }

  let sum = 0;

  for (const num of collection) {
    sum += num;
  }

  return sum / collection.length;
}
