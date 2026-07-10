// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Groups elements of an array by a key returned by the given function.
 *
 * @typeParam T The type of the array elements
 * @typeParam K The type of the group keys
 *
 * @param array The array to group
 * @param keyFn The function that returns the key for each element
 *
 * @returns An object mapping keys to arrays of elements
 *
 * @example Basic usage
 * ```ts
 * import { groupBy } from "@std/collections/group-by";
 * import { assertEquals } from "@std/assert";
 *
 * const pets = [
 *   { type: "dog", name: "Fido" },
 *   { type: "cat", name: "Whiskers" },
 *   { type: "dog", name: "Rover" },
 * ];
 *
 * const grouped = groupBy(pets, (pet) => pet.type);
 * assertEquals(grouped, {
 *   dog: [{ type: "dog", name: "Fido" }, { type: "dog", name: "Rover" }],
 *   cat: [{ type: "cat", name: "Whiskers" }],
 * });
 * ```
 */
export function groupBy<T, K extends PropertyKey>(
  array: readonly T[],
  keyFn: (element: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const element of array) {
    const key = keyFn(element);
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key]!.push(element);
    } else {
      result[key] = [element];
    }
  }
  return result;
}
