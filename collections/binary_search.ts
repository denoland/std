// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A binary search that accounts for non-exact matches.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of `haystack`.
 *
 * @param haystack The array to search. This MUST be sorted in ascending order, otherwise results may be incorrect.
 * @param needle The value to search for.
 * @returns
 * - If `needle` is matched exactly, the index of `needle`. If multiple elements in `haystack` are equal to `needle`,
 *   the index of the first match found (which may not be the first sequentially) is returned.
 * - Otherwise, the [bitwise complement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT)
 *   of `needle`'s insertion index if it were added to `haystack` in sorted order.
 *
 * Return value semantics are the same as C#'s [`Array.BinarySearch`](https://learn.microsoft.com/en-us/dotnet/api/system.array.binarysearch#system-array-binarysearch(system-array-system-object))
 * and Java's [`Arrays.binarySearch`](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html#binarySearch-int:A-int-).
 *
 * @example Usage
 * ```ts
 * import { binarySearch } from "@std/collections/binary-search";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(binarySearch([0, 1], 0), 0);
 * assertEquals(binarySearch([0, 1], 1), 1);
 * assertEquals(binarySearch([0, 1], -0.5), -1); // (bitwise complement of 0)
 * assertEquals(binarySearch([0, 1], 0.5), -2); // (bitwise complement of 1)
 * assertEquals(binarySearch([0, 1], 1.5), -3); // (bitwise complement of 2)
 * ```
 */
export function binarySearch<
  T extends ArrayLike<number> | ArrayLike<bigint> | ArrayLike<string>,
>(
  haystack: T,
  needle: T[number],
): number {
  let start = 0;
  let mid: number;

  for (
    let end = haystack.length - 1;
    start <= end;
    haystack[mid]! < needle ? start = mid + 1 : end = mid - 1
  ) {
    mid = Math.floor((start + end) / 2);
    if (haystack[mid]! === needle) return mid;
  }

  return ~start;
}
