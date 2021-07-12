import { Predicate } from "./types.ts";

/**
 * Returns the last element in the given array matching the given predicate
 *
 * Example:
 *
 * ```typescript
 * const numbers = [ 4, 2, 7 ]
 * const lastEvenNumber = findLast(numbers, it => it % 2 === 0)
 *
 * console.assert(lastEvenNumber === 2)
 * ```
 */
export function findLast<T>(
  _array: Array<T>,
  _predicate: Predicate<T>,
): T | undefined {
  throw new Error("unimplemented");
}
