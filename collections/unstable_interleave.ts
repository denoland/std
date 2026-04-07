// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Merges multiple iterables into a single array by round-robin picking one
 * element from each source in turn. Unlike {@linkcode zip}, which stops at
 * the shortest array and produces tuples, `interleave` continues through
 * all elements and returns a flat array.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T Tuple of element types, one per input iterable; result is
 * `T[number][]`.
 *
 * @param iterables The iterables to interleave.
 * @returns A new array containing elements from all input iterables in
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
 *
 * @example With iterables
 * ```ts
 * import { interleave } from "@std/collections/unstable-interleave";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   interleave(new Set([1, 2, 3]), ["a", "b", "c"]),
 *   [1, "a", 2, "b", 3, "c"],
 * );
 * ```
 */
export function interleave<T extends unknown[]>(
  ...iterables: { [K in keyof T]: Iterable<T[K]> }
): T[number][] {
  const arrayCount = iterables.length;
  if (arrayCount === 0) return [];

  const arrays = iterables.map((it) => Array.isArray(it) ? it : Array.from(it));

  let maxLength = 0;
  let minLength = Infinity;
  let totalLength = 0;
  for (let i = 0; i < arrayCount; ++i) {
    const len = arrays[i]!.length;
    totalLength += len;
    if (len > maxLength) maxLength = len;
    if (len < minLength) minLength = len;
  }

  const result: T[number][] = new Array(totalLength);

  if (arrayCount === 2) {
    const a = arrays[0]!;
    const b = arrays[1]!;
    let k = 0;
    for (let i = 0; i < minLength; ++i) {
      result[k++] = a[i] as T[number];
      result[k++] = b[i] as T[number];
    }
    for (let i = minLength; i < a.length; ++i) {
      result[k++] = a[i] as T[number];
    }
    for (let i = minLength; i < b.length; ++i) {
      result[k++] = b[i] as T[number];
    }
    return result;
  }

  if (minLength === maxLength) {
    let k = 0;
    for (let i = 0; i < maxLength; ++i) {
      for (let j = 0; j < arrayCount; ++j) {
        result[k++] = arrays[j]![i] as T[number];
      }
    }
    return result;
  }

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
