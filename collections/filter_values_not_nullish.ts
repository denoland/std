// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns a new collection with all entries of the given collection except the ones that have a nullish value
 *
 * Example:
 *
 * ```ts
 * import { filterValuesNotNullish } from "./filter_values_not_nullish.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const people = {
 *     'Arnold': 'William',
 *     'Sarah': null,
 *     'Kim': 'Martha',
 * }
 * const peopleWithMiddleNames = filterValuesNotNullish(middleNames)
 *
 * assertEquals(peopleWithMiddleNames, {
 *     'Arnold': 'William',
 *     'Kim': 'Martha',
 * })
 * ```
 */
export function filterValuesNotNullish<T>(
  record: Readonly<Record<string, T>>,
): Record<string, NonNullable<T>> {
  const result: Record<string, NonNullable<T>> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value !== null && value !== undefined) {
      result[key] = value as NonNullable<T>;
    }
  }

  return result;
}
