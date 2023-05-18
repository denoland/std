// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * If the given value is part of the given object it returns true, otherwise it
 * returns false. Doesn't work with non-primitive values: includesValue({x: {}},
 * {}) returns false.
 *
 * @example
 * ```ts
 * import { includesValue } from "https://deno.land/std@$STD_VERSION/collections/includes_value.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const input = {
 *   first: 33,
 *   second: 34,
 * };
 *
 * assertEquals(includesValue(input, 34), true);
 * ```
 */
export function includesValue<
  const T extends Readonly<Record<string, unknown>>,
  const U,
>(
  record: T,
  value: U,
): IncludesValue<T, U>;

export function includesValue<T>(
  record: Readonly<Record<string, T>>,
  value: T,
): boolean {
  for (const i in record) {
    if (
      Object.hasOwn(record, i) &&
      (record[i] === value || Number.isNaN(value) && Number.isNaN(record[i]))
    ) {
      return true;
    }
  }

  return false;
}

type IncludesValue<T extends Readonly<Record<string, unknown>>, U> = {
  [K in keyof T]: T[K] extends U ? true : false;
}[keyof T] extends false ? false : true;
