// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Concatenate the given arrays into a new Uint8Array.
 *
 * ```ts
 * import { concat } from "https://deno.land/std@$STD_VERSION/bytes/concat.ts";
 * const a = new Uint8Array([0, 1, 2]);
 * const b = new Uint8Array([3, 4, 5]);
 * console.log(concat(a, b)); // [0, 1, 2, 3, 4, 5]
 * ```
 */
export function concat(buf: Uint8Array[]): Uint8Array;
export function concat(...buf: Uint8Array[]): Uint8Array;
export function concat(...buf: (Uint8Array | Uint8Array[])[]): Uint8Array {
  // No need to concatenate if there is only one element in array or sub-array
  if (buf.length === 1) {
    if (!Array.isArray(buf[0])) {
      return buf[0];
    } else if (buf[0].length === 1) {
      return buf[0][0];
    }
  }

  let length = 0;
  for (const b of buf) {
    if (Array.isArray(b)) {
      for (const b1 of b) {
        length += b1.length;
      }
    } else {
      length += b.length;
    }
  }

  const output = new Uint8Array(length);
  let index = 0;
  for (const b of buf) {
    if (Array.isArray(b)) {
      for (const b1 of b) {
        output.set(b1, index);
        index += b1.length;
      }
    } else {
      output.set(b, index);
      index += b.length;
    }
  }

  return output;
}
