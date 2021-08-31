/**
 * Returns all elements in the given collection until the last element that does not match the given predicate
 *
 * Example:
 * ```ts
 * import { dropLastWhile } from "./drop_last_while.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const values = [22, 30, 44];
 *
 * const notFourtyFour = dropLastWhile(values, i => i != 44);
 *
 * assertEquals(
 *   notFourtyFour,
 *   [22, 30]
 * );
 * ```
 *
 */
export function dropLastWhile<T>(
  array: readonly T[],
  predicate: (el: T) => boolean,
): T[] {
  let offset = array.length;
  while (0 < offset && predicate(array[offset - 1])) offset--;

  return array.slice(0, offset);
}
