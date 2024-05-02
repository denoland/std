// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns a new record with all entries of the given record except the ones
 * that have a value that does not match the given predicate.
 *
 * @template T The type of the values in the input record.
 * @param record The record to filter values from.
 * @param predicate The function to test each value for a condition.
 * @returns A new record with all entries that have a value that matches the
 * given predicate.
 *
 * @example Basic usage
 * ```ts
 * import { filterValues } from "@std/collections/filter-values";
 *
 * const people = {
 *   "Arnold": 37,
 *   "Sarah": 7,
 *   "Kim": 23,
 * };
 *
 * filterValues(people, (it) => it >= 18);
 * // { "Arnold": 37, "Kim": 23 }
 * ```
 */
export function filterValues<T>(
  record: Readonly<Record<string, T>>,
  predicate: (value: T) => boolean,
): Record<string, T> {
  const ret: Record<string, T> = {};
  const entries = Object.entries(record);

  for (const [key, value] of entries) {
    if (predicate(value)) {
      ret[key] = value;
    }
  }

  return ret;
}
