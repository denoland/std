// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Arr, IsLength, IsPositiveInteger } from "./_type_utils.ts";

/**
 * Splits the given array into chunks of the given size and returns them.
 *
 * @example
 * ```ts
 * import { chunk } from "https://deno.land/std@$STD_VERSION/collections/chunk.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
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
export function chunk<const T extends Arr, const N extends number>(
  array: T,
  size: N,
): IsPositiveInteger<N> extends true ? Chunk<T, N> : never;

export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new Error(
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

// https://github.com/type-challenges/type-challenges/issues/5621
// deno-fmt-ignore
type Chunk<
  T extends Arr,
  N extends number,
  CurChunk extends Arr = [],
  Left extends Arr = [],
> = T extends readonly [infer Head, ...infer Tail]
      ? IsLength<CurChunk, N> extends true
        ? Chunk<Tail, N, [Head], [...Left, CurChunk]>
        : Chunk<Tail, N, [...CurChunk, Head], Left>
      : CurChunk extends []
        ? Left
        : [...Left, CurChunk];
