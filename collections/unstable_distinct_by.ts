// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns all elements in the given array that produce a unique value using
 * the given discriminator, with the first matching occurrence retained.
 *
 * Uniqueness is determined by same-value-zero equality of the returned values.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the elements in the input array.
 * @typeParam D The type of the values produced by the discriminator function.
 *
 * @param array The array to filter for distinct elements.
 * @param discriminator The function to extract the value to compare for
 * uniqueness. The function receives the element and its index.
 *
 * @returns An array of distinct elements in the input array.
 *
 * @example Basic usage
 * ```ts
 * import { distinctBy } from "@std/collections/unstable-distinct-by";
 * import { assertEquals } from "@std/assert";
 *
 * const users = [{ id: 1, name: "Anna" }, { id: 2, name: "Kim" }, { id: 1, name: "Anna again" }];
 * const uniqueUsers = distinctBy(users, (user) => user.id);
 *
 * assertEquals(uniqueUsers, [{ id: 1, name: "Anna" }, { id: 2, name: "Kim" }]);
 * ```
 *
 * @example Using the index parameter
 * ```ts
 * import { distinctBy } from "@std/collections/unstable-distinct-by";
 * import { assertEquals } from "@std/assert";
 *
 * const items = [25, "asdf", true];
 * const result = distinctBy(items, (_, index) => index > 1);
 *
 * assertEquals(result, [25, true]);
 * ```
 */
export function distinctBy<T, D>(
  array: Iterable<T>,
  discriminator: (el: T, index: number) => D,
): T[] {
  const keys = new Set<D>();
  const result: T[] = [];
  let index = 0;
  for (const element of array) {
    const key = discriminator(element, index++);
    if (!keys.has(key)) {
      keys.add(key);
      result.push(element);
    }
  }
  return result;
}
