// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Applies the given transformer to all entries in the given record and returns
 * a new record containing the results.
 *
 * @typeParam T The type of the values in the input record.
 * @typeParam O The type of the values in the output record.
 *
 * @param record The record to map entries from.
 * @param transformer The function to transform each entry.
 *
 * @returns A new record with all entries transformed by the given transformer.
 *
 * @example Basic usage
 * ```ts
 * import { mapEntries } from "@std/collections/map-entries";
 * import { assertEquals } from "@std/assert";
 *
 * const usersById = {
 *   "a2e": { name: "Kim", age: 22 },
 *   "dfe": { name: "Anna", age: 31 },
 *   "34b": { name: "Tim", age: 58 },
 * };
 *
 * const agesByNames = mapEntries(usersById, ([id, { name, age }]) => [name, age]);
 *
 * assertEquals(
 *   agesByNames,
 *   {
 *     Kim: 22,
 *     Anna: 31,
 *     Tim: 58,
 *   },
 * );
 * ```
 */
export function mapEntries<T, O>(
  record: Readonly<Record<string, T>>,
  transformer: (entry: [string, T]) => [string, O],
): Record<string, O> {
  const result: Record<string, O> = {};
  const entries = Object.entries(record);

  for (const entry of entries) {
    const [mappedKey, mappedValue] = transformer(entry);

    result[mappedKey] = mappedValue;
  }

  return result;
}
