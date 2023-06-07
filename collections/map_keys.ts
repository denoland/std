// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given transformer to all keys in the given record's entries and
 * returns a new record containing the transformed entries.
 *
 * If the transformed entries contain the same key multiple times, only the last
 * one will appear in the returned record.
 *
 * @example
 * ```ts
 * import { mapKeys } from "https://deno.land/std@$STD_VERSION/collections/map_keys.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const counts = { a: 5, b: 3, c: 8 };
 *
 * assertEquals(
 *   mapKeys(counts, (it) => it.toUpperCase()),
 *   {
 *     A: 5,
 *     B: 3,
 *     C: 8,
 *   },
 * );
 * ```
 */
export function mapKeys<T, KeyIn extends string, KeyOut extends string>(
  record: Readonly<Partial<Record<KeyIn, T>>>,
  transformer: (key: KeyIn) => KeyOut,
): Partial<Record<KeyOut, T>> {
  const ret: Partial<Record<KeyOut, T>> = {};
  const keys = Object.keys(record) as KeyIn[];

  for (const key of keys) {
    const mappedKey = transformer(key);

    ret[mappedKey] = record[key];
  }

  return ret;
}
