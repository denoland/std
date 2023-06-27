// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Applies the given transformer to all values in the given record and returns a
 * new record containing the resulting keys associated to the last value that
 * produced them.
 *
 * @example
 * ```ts
 * import { mapValues } from "https://deno.land/std@$STD_VERSION/collections/map_values.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const usersById = {
 *   "a5ec": { name: "Mischa" },
 *   "de4f": { name: "Kim" },
 * };
 * const namesById = mapValues(usersById, (it) => it.name);
 *
 * assertEquals(
 *   namesById,
 *   {
 *     "a5ec": "Mischa",
 *     "de4f": "Kim",
 *   },
 * );
 * ```
 */
export function mapValues<T, O, K extends string>(
  record: Readonly<Partial<Record<K, T>>>,
  transformer: (value: T) => O,
): Partial<Record<K, O>>;
/** @deprecated (will be removed after 0.196.0) Use `mapValues<T, O, K extends string>(record: Readonly<Partial<Record<K, T>>>, transformer: (value: T) => O): Partial<Record<K, O>>` instead. */
export function mapValues<T, O>(
  record: Readonly<Record<string, T>>,
  transformer: (value: T) => O,
): Record<string, O>;
export function mapValues<T, O, K extends string>(
  record: Readonly<Partial<Record<K, T>>>,
  transformer: (value: T) => O,
): Partial<Record<K, O>> {
  const ret: Partial<Record<K, O>> = {};
  const entries = Object.entries(record) as [K, T][];

  for (const [key, value] of entries) {
    const mappedValue = transformer(value);

    ret[key] = mappedValue;
  }

  return ret;
}
