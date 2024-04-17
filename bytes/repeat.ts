// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { copy } from "./copy.ts";

/**
 * Returns a new byte slice composed of `count` repetitions of the `source`
 * array.
 *
 * If `count` is negative, a `RangeError` is thrown.
 *
 * @param source Source array to repeat.
 * @param count Number of times to repeat the source array.
 * @returns A new byte slice composed of `count` repetitions of the `source`
 * array.
 *
 * @example Basic usage
 * ```ts
 * import { repeat } from "https://deno.land/std@$STD_VERSION/bytes/repeat.ts";
 *
 * const source = new Uint8Array([0, 1, 2]);
 *
 * repeat(source, 3); // Uint8Array(9) [0, 1, 2, 0, 1, 2, 0, 1, 2]
 *
 * repeat(source, 0); // Uint8Array(0) []
 *
 * repeat(source, -1); // Throws `RangeError`
 * ```
 */
export function repeat(source: Uint8Array, count: number): Uint8Array {
  if (count === 0) {
    return new Uint8Array();
  }

  if (count < 0) {
    throw new RangeError("bytes: negative repeat count");
  }

  if (!Number.isInteger(count)) {
    throw new Error("bytes: repeat count must be an integer");
  }

  const repeated = new Uint8Array(source.length * count);
  let offset = 0;

  while (offset < repeated.length) {
    offset += copy(source, repeated, offset);
  }

  return repeated;
}
