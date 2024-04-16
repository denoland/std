// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns `true` if the suffix array appears at the end of the source array,
 * `false` otherwise.
 *
 * The complexity of this function is `O(suffix.length)`.
 *
 * @param source Source array to check.
 * @param suffix Suffix array to check for.
 * @returns `true` if the suffix array appears at the end of the source array,
 * `false` otherwise.
 *
 * @example Basic usage
 * ```ts
 * import { endsWith } from "https://deno.land/std@$STD_VERSION/bytes/ends_with.ts";
 *
 * const source = new Uint8Array([0, 1, 2, 1, 2, 1, 2, 3]);
 * const suffix = new Uint8Array([1, 2, 3]);
 *
 * endsWith(source, suffix); // true
 * ```
 */
export function endsWith(source: Uint8Array, suffix: Uint8Array): boolean {
  let srci = source.length - 1;
  let sfxi = suffix.length - 1;
  for (; sfxi >= 0; srci--, sfxi--) {
    if (source[srci] !== suffix[sfxi]) return false;
  }
  return true;
}
