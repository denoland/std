// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Merges multiple arrays into a single array by round-robin picking one
 * element from each source in turn. Unlike {@linkcode zip}, which stops at
 * the shortest array and produces tuples, `interleave` continues through
 * all elements and returns a flat array.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T Tuple of element types, one per input array; result is
 * `T[number][]`.
 *
 * @param arrays The arrays to interleave.
 *
 * @returns A new array containing elements from all input arrays in
 * round-robin order.
 *
 * @example Basic usage
 * ```ts
 * import { interleave } from "@std/collections/unstable-interleave";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3];
 * const letters = ["a", "b", "c"];
 *
 * assertEquals(interleave(numbers, letters), [1, "a", 2, "b", 3, "c"]);
 * ```
 *
 * @example Unequal-length arrays
 * ```ts
 * import { interleave } from "@std/collections/unstable-interleave";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   interleave([1, 2, 3], ["a", "b"], [true]),
 *   [1, "a", true, 2, "b", 3],
 * );
 * ```
 */
export function interleave<T extends unknown[]>(
  ...arrays: { [K in keyof T]: ReadonlyArray<T[K]> }
): T[number][] {
  const arrayCount = arrays.length;
  if (arrayCount === 0) return [];

  let maxLength = 0;
  let totalLength = 0;
  for (let i = 0; i < arrayCount; ++i) {
    const len = arrays[i]!.length;
    totalLength += len;
    if (len > maxLength) maxLength = len;
  }

  const result: T[number][] = new Array(totalLength);
  let k = 0;

  for (let i = 0; i < maxLength; ++i) {
    for (let j = 0; j < arrayCount; ++j) {
      if (i < arrays[j]!.length) {
        result[k++] = arrays[j]![i] as T[number];
      }
    }
  }

  return result;
}
