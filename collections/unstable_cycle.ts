// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Creates an iterator that cycles indefinitely over the provided iterable.
 *
 * Each time the iterable is exhausted, a new iterator is obtained to start the cycle again.
 * This generator will yield the values from the iterable continuously.
 *
 * > **Note:** If the iterable is empty, the generator will keep restarting and yield nothing.
 *
 * @typeParam T The type of the elements in the iterable.
 * @param iterable The iterable whose values are to be cycled.
 * @returns A generator that yields values from the iterable in an endless cycle.
 *
 * @example Basic usage
 * ```ts
 * import { cycle } from "@std/collections/unstable-cycle";
 * import { assertEquals } from "@std/assert";
 *
 * const cyclic = cycle([1, 2, 3]);
 * const result: number[] = [];
 *
 * for (const num of cyclic) {
 *   result.push(num);
 *   if (result.length === 7) break;
 * }
 *
 * assertEquals(result, [1, 2, 3, 1, 2, 3, 1]);
 * ```
 */
export function* cycle<T>(iterable: Iterable<T>): Generator<T> {
  let iterator = iterable[Symbol.iterator]();

  while (true) {
    const result = iterator.next();
    if (result.done) {
      iterator = iterable[Symbol.iterator]();
    } else {
      yield result.value;
    }
  }
}
