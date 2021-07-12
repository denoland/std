// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Builds 2-tuples of elements from the given array with matching indices, stopping when the smaller array's end is reached
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 1, 2, 3, 4 ]
 * const letters = [ 'a', 'b', 'c', 'd' ]
 * const pairs = zip(numbers, letters)
 *
 * console.assert(pairs === [
 *     [ 1, 'a' ],
 *     [ 2, 'b' ],
 *     [ 3, 'c' ],
 *     [ 4, 'd' ],
 * ])
 * ```
 */
export function zip<T, U>(
  _array: Array<T>,
  _withArray: Array<U>,
): Array<[T, U]> {
  throw new Error("unimplemented");
}
