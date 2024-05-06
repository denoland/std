// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Calls the given reducer on each element of the given collection, passing its
 * result as the accumulator to the next respective call, starting with the
 * given initialValue. Returns all intermediate accumulator results.
 *
 * @template T The type of the elements in the array.
 * @template O The type of the accumulator.
 *
 * @param array The array to reduce.
 * @param reducer The reducer function to apply to each element.
 * @param initialValue The initial value of the accumulator.
 *
 * @example Basic usage
 * ```ts
 * import { runningReduce } from "@std/collections/running-reduce";
 *
 * const numbers = [1, 2, 3, 4, 5];
 *
 * runningReduce(numbers, (sum, number) => sum + number, 0);
 * // [1, 3, 6, 10, 15]
 * ```
 */
export function runningReduce<T, O>(
  array: readonly T[],
  reducer: (accumulator: O, current: T, currentIndex: number) => O,
  initialValue: O,
): O[] {
  let currentResult = initialValue;
  return array.map((el, currentIndex) =>
    currentResult = reducer(currentResult, el, currentIndex)
  );
}
