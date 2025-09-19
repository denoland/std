// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Splits the given array into an array of chunks of the given size and returns them.
 *
 * @typeParam T The type of the elements in the iterable.
 *
 * @param iterable The iterable to take elements from.
 * @param size The size of the chunks. This must be a positive integer.
 *
 * @returns An array of chunks of the given size.
 *
 * @example Basic usage
 * ```ts
 * import { chunk } from "@std/collections/chunk";
 * import { assertEquals } from "@std/assert";
 *
 * const words = [
 *   "lorem",
 *   "ipsum",
 *   "dolor",
 *   "sit",
 *   "amet",
 *   "consetetur",
 *   "sadipscing",
 * ];
 * const chunks = chunk(words, 3);
 *
 * assertEquals(
 *   chunks,
 *   [
 *     ["lorem", "ipsum", "dolor"],
 *     ["sit", "amet", "consetetur"],
 *     ["sadipscing"],
 *   ],
 * );
 * ```
 */
export function chunk<T>(
  iterable: Iterable<T>,
  size: number,
): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new RangeError(
      `Expected size to be an integer greater than 0 but found ${size}`,
    );
  }
  const result: T[][] = [];

  // Faster path
  if (Array.isArray(iterable)) {
    let index = 0;
    while (index < iterable.length) {
      result.push(iterable.slice(index, index + size));
      index += size;
    }
    return result;
  }

  let chunk: T[] = [];
  for (const item of iterable) {
    chunk.push(item);
    if (chunk.length === size) {
      result.push(chunk);
      chunk = [];
    }
  }
  if (chunk.length > 0) {
    result.push(chunk);
  }
  return result;
}
