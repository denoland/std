// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Builds N-tuples of elements from the given N iterables with matching
 * indices, stopping when the shortest iterable is exhausted. All input
 * iterables are consumed eagerly.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The tuple of element types in the input iterables.
 *
 * @param iterables The iterables to zip.
 *
 * @returns A new array containing N-tuples of elements from the given
 * iterables.
 *
 * @example Basic usage
 * ```ts
 * import { zip } from "@std/collections/unstable-zip";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const letters = ["a", "b", "c", "d"];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(
 *   pairs,
 *   [
 *     [1, "a"],
 *     [2, "b"],
 *     [3, "c"],
 *     [4, "d"],
 *   ],
 * );
 * ```
 *
 * @example With iterables
 * ```ts
 * import { zip } from "@std/collections/unstable-zip";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   zip(new Set([1, 2, 3]), ["a", "b", "c"]),
 *   [[1, "a"], [2, "b"], [3, "c"]],
 * );
 * ```
 */
export function zip<T extends unknown[]>(
  ...iterables: { [K in keyof T]: Iterable<T[K]> }
): T[] {
  const arrayCount = iterables.length;
  if (arrayCount === 0) return [];

  const arrays = iterables.map((it) => Array.isArray(it) ? it : Array.from(it));

  let minLength = arrays[0]!.length;
  for (let i = 1; i < arrayCount; ++i) {
    const len = arrays[i]!.length;
    if (len < minLength) minLength = len;
  }

  const result: T[] = new Array(minLength);

  // Fast path for two iterables
  if (arrayCount === 2) {
    const a = arrays[0]!;
    const b = arrays[1]!;
    for (let i = 0; i < minLength; ++i) {
      result[i] = [a[i], b[i]] as T;
    }
    return result;
  }

  for (let i = 0; i < minLength; ++i) {
    const tuple: unknown[] = new Array(arrayCount);
    for (let j = 0; j < arrayCount; ++j) {
      tuple[j] = arrays[j]![i];
    }
    result[i] = tuple as T;
  }

  return result;
}
