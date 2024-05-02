// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns a new record with all entries of the given record except the ones
 * that do not match the given predicate.
 *
 * @template T The type of the values in the input record.
 * @param record The record to filter entries from.
 * @param predicate The function to test each entry for a condition.
 * @returns A new record with all entries that match the given predicate.
 *
 * @example Basic usage
 * ```ts
 * import { filterEntries } from "@std/collections/filter-entries";
 *
 * const menu = {
 *   "Salad": 11,
 *   "Soup": 8,
 *   "Pasta": 13,
 * };
 *
 * filterEntries(
 *   menu,
 *   ([item, price]) => item !== "Pasta" && price < 10,
 * );
 * // { "Soup": 8 }
 * ```
 */
export function filterEntries<T>(
  record: Readonly<Record<string, T>>,
  predicate: (entry: [string, T]) => boolean,
): Record<string, T> {
  const ret: Record<string, T> = {};
  const entries = Object.entries(record);

  for (const [key, value] of entries) {
    if (predicate([key, value])) {
      ret[key] = value;
    }
  }

  return ret;
}
