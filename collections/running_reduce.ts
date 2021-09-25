// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Calls the given reducer on each element of the given collection, passing it's
 * result as the accumulator to the next respective call. If initialValue is given,
 * starting with that value. Returns all intermediate accumulator results.
 *
 * Example:
 *
 * ```ts
 * import { runningReduce } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const firstNumbers = [1, 2, 3, 4, 5];
 * const result = runningReduce(firstNumbers, (sum, current) => sum + current);
 *
 * assertEquals(result, [1, 3, 6, 10, 15]);
 *
 * const secondNumbers = [1, 2, 3, 4, 5]
 * const resultWithInitialValue = runningReduce(secondNumbers, (sum, current) => sum + current, 5);
 *
 * assertEquals(resultWithInitialValue, [6, 8, 11, 15, 20]);
 * ```
 */
export function runningReduce<T>(
  array: readonly T[],
  reducer: (accumulator: T, current: T) => T,
  initialValue?: T,
): T[] {
  let currentResult: T;

  if (!initialValue) {
    switch (typeof array[0]) {
      case "string":
        currentResult = "" as unknown as T;
        break;
      case "number":
        currentResult = 0 as unknown as T;
        break;
    }
  } else {
    currentResult = initialValue;
  }

  return array.map((el) => currentResult = reducer(currentResult, el));
}
