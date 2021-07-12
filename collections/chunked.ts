// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Splits the given array into chunks of the given size and returns them
 *
 * Example:
 *
 * ```typescript
 * const words = [ 'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consetetur', 'sadipscing' ]
 * const chunks = chunked(words, 3)
 *
 * console.assert(chunks === [
 *     [ 'lorem', 'ipsum', 'dolor' ],
 *     [ 'sit', 'amet', 'consetetur' ],
 *     [ 'sadipscing' ],
 * ])
 * ```
 */
export function chunked<T>(
  _array: Array<T>,
  _size: number,
): Array<Array<T>> {
  throw new Error("unimplemented");
}
