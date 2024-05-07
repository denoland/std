// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Splits the given array into chunks of the given size and returns them.
 *
 * @template T Type of the elements in the input array.
 *
 * @param array The array to split into chunks.
 * @param size The size of the chunks. This my be a positive integer.
 *
 * @returns An array of chunks of the given size.
 *
 * @example Basic usage
 * ```ts
 * import { chunk } from "@std/collections/chunk";
 * import { assertEquals } from "@std/assert/assert-equals";
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
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new RangeError(
      `Expected size to be an integer greater than 0 but found ${size}`,
    );
  }

  if (array.length === 0) {
    return [];
  }

  const ret = Array.from<T[]>({ length: Math.ceil(array.length / size) });
  let readIndex = 0;
  let writeIndex = 0;

  while (readIndex < array.length) {
    ret[writeIndex] = array.slice(readIndex, readIndex + size);

    writeIndex += 1;
    readIndex += size;
  }

  return ret;
}
