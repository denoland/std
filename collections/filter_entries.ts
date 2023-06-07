// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns a new record with all entries of the given record except the ones
 * that do not match the given predicate.
 *
 * @example
 * ```ts
 * import { filterEntries } from "https://deno.land/std@$STD_VERSION/collections/filter_entries.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const menu = {
 *   "Salad": 11,
 *   "Soup": 8,
 *   "Pasta": 13,
 * } as const;
 * const myOptions = filterEntries(
 *   menu,
 *   ([item, price]) => item !== "Pasta" && price < 10,
 * );
 *
 * assertEquals(
 *   myOptions,
 *   {
 *     "Soup": 8,
 *   },
 * );
 * ```
 */
export function filterEntries<T, K extends string>(
  record: Readonly<Partial<Record<K, T>>>,
  predicate: (entry: [K, T]) => boolean,
): Partial<Record<K, T>> {
  const ret: Partial<Record<K, T>> = {};
  const entries = Object.entries(record) as [K, T][];

  for (const [key, value] of entries) {
    if (predicate([key, value])) {
      ret[key] = value;
    }
  }

  return ret;
}
