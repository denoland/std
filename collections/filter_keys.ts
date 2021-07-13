// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Predicate } from "./types.ts";

/**
 * Returns a new record with all entries of the given record except the ones that have a key that does not match the given predicate
 *
 * Example:
 *
 * ```typescript
 * const menu = {
 *     'Salad': 11,
 *     'Soup': 8,
 *     'Pasta': 13,
 * }
 * const menuWithoutSalad = filterKeys(menu, it => it !== 'Salad')
 *
 * console.assert(menuWithoutSalad === {
 *     'Soup': 8,
 *     'Pasta': 13,
 * })
 * ```
 */
export function filterKeys<T>(
  record: Record<string, T>,
  predicate: Predicate<string>,
): Record<string, T> {
  const ret: Record<string, T> = {};
  const keys = Object.keys(record);

  keys.forEach((key) => {
    if (predicate(key)) {
      ret[key] = record[key];
    }
  });

  return ret;
}
