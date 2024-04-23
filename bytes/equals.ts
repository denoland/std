// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Check whether byte slices are equal to each other using 8-bit comparisons.
 *
 * @param a First array to check equality
 * @param b Second array to check equality
 * @returns `true` if the arrays are equal, `false` otherwise
 *
 * @private
 */
function equalsNaive(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Check whether byte slices are equal to each other using 32-bit comparisons.
 *
 * @param a First array to check equality.
 * @param b Second array to check equality.
 * @returns `true` if the arrays are equal, `false` otherwise.
 *
 * @private
 */
function equals32Bit(a: Uint8Array, b: Uint8Array): boolean {
  const len = a.length;
  const compressible = Math.floor(len / 4);
  const compressedA = new Uint32Array(a.buffer, 0, compressible);
  const compressedB = new Uint32Array(b.buffer, 0, compressible);
  for (let i = compressible * 4; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }
  for (let i = 0; i < compressedA.length; i++) {
    if (compressedA[i] !== compressedB[i]) return false;
  }
  return true;
}

/**
 * Check whether byte slices are equal to each other.
 *
 * @param a First array to check equality.
 * @param b Second array to check equality.
 * @returns `true` if the arrays are equal, `false` otherwise.
 *
 * @example Basic usage
 * ```ts
 * import { equals } from "https://deno.land/std@$STD_VERSION/bytes/equals.ts";
 *
 * const a = new Uint8Array([1, 2, 3]);
 * const b = new Uint8Array([1, 2, 3]);
 * const c = new Uint8Array([4, 5, 6]);
 *
 * equals(a, b); // true
 * equals(b, c); // false
 * ```
 */
export function equals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.length < 1000 ? equalsNaive(a, b) : equals32Bit(a, b);
}
