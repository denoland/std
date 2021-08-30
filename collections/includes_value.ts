/**
 * Returns whether the given value is part of the collection.
 *
 * Example:
 * ```ts
 * import { includesValue } from "./includes_value.ts";
 * import { assert } from "../testing/asserts.ts";
 *
 * const input = {
 *   first: 33,
 *   second: 34,
 * };
 *
 * assert(includesValue(input, 34));
 */

export function includesValue<T>(
  collection: Record<string, T>,
  value: T,
): boolean {
  return Object.values(collection).includes(value);
}
