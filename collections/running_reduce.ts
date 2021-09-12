// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Calls the given reducer on each element of the given collection, passing it's
 * result as the accumulator to the next respective call, starting with the given
 * initialValue. Returns all intermediate accumulator results.
 *
 * Example:
 *
 * ```ts
 * import { runningReduce } from "https://deno.land/std@$STD_VERSION/collections/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const numbers = [1, 2, 3, 4, 5];
 * const sumSteps = runningReduce(numbers, (sum, current) => sum + current, 0);
 *
 * assertEquals(sumSteps, [1, 3, 6, 10, 15]);
 * ```
 */
export function runningReduce<T, A>(
  array: readonly T[],
  reducer: (accumulator: A, current: T) => A,
  initialValue: A,
): A[] {
  let _initialValue = initialValue;
  return array.map((el) => _initialValue = reducer(_initialValue, el));
}
