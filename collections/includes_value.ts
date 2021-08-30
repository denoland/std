/**
 * Returns whether the given value is part of the collection.
 *
 * Example:
 * ```ts
 * import { includesValue } from "./includes_value.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const input = {
 *   first: 33,
 *   second: 34,
 * };
 *
 * assertEquals(includesValue(input, 34), true);
 */

export function includesValue<T>(
  record: Record<string, T>,
  value: T,
): boolean {
  for (const i in record) {
    if (record[i] === value) {
      return true;
    }
  }

  return false;
}
