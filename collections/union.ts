// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns all distinct elements that appear in any of the given arrays.
 *
 * @template T The type of the array elements.
 *
 * @param arrays The arrays to get the union of.
 *
 * @returns A new array containing all distinct elements from the given arrays.
 *
 * @example
 * ```ts
 * import { union } from "@std/collections/union";
 *
 * const soupIngredients = ["Pepper", "Carrots", "Leek"];
 * const saladIngredients = ["Carrots", "Radicchio", "Pepper"];
 *
 * union(soupIngredients, saladIngredients);
 * // ["Pepper", "Carrots", "Leek", "Radicchio"]
 * ```
 */
export function union<T>(...arrays: Iterable<T>[]): T[] {
  const set = new Set<T>();

  for (const array of arrays) {
    for (const element of array) {
      set.add(element);
    }
  }

  return Array.from(set);
}
