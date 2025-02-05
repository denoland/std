// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Applies the given selector to all elements of the given collection and
 * returns the min value of all elements. If an empty array is provided the
 * function will return undefined.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The smallest value of the given function or undefined if there are
 * no elements.
 *
 * @example Basic usage
 * ```ts
 * import { minOf } from "@std/collections/min-of";
 * import { assertEquals } from "@std/assert";
 *
 * const inventory = [
 *   { name: "mustard", count: 2 },
 *   { name: "soy", count: 4 },
 *   { name: "tomato", count: 32 },
 * ];
 *
 * const minCount = minOf(inventory, (item) => item.count);
 *
 * assertEquals(minCount, 2);
 * ```
 */
export function minOf<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => number,
): number | undefined;
/**
 * Applies the given selector to all elements of the given collection and
 * returns the min value of all elements. If an empty array is provided the
 * function will return undefined.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { minOf } from "@std/collections/min-of";
 * import { assertEquals } from "@std/assert";
 *
 * const inventory = [
 *   { name: "mustard", count: 2n },
 *   { name: "soy", count: 4n },
 *   { name: "tomato", count: 32n },
 * ];
 *
 * const minCount = minOf(inventory, (item) => item.count);
 *
 * assertEquals(minCount, 2n);
 * ```
 */
export function minOf<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => bigint,
): bigint | undefined;
export function minOf<
  T,
  S extends
    | ((el: T, index: number) => number)
    | ((el: T, index: number) => bigint),
>(
  array: Iterable<T>,
  selector: S,
): ReturnType<S> | undefined {
  if (Array.isArray(array)) {
    const length = array.length;
    if (length === 0) return undefined;

    let min = selector(array[0]!, 0) as ReturnType<S>;
    if (Number.isNaN(min)) return min;

    for (let i = 1; i < length; i++) {
      const currentValue = selector(array[i]!, i) as ReturnType<S>;
      if (currentValue < min) {
        min = currentValue;
      } else if (Number.isNaN(currentValue)) {
        return currentValue;
      }
    }

    return min;
  }

  let index = 0;
  const iter = array[Symbol.iterator]();
  const first = iter.next();

  if (first.done) return undefined;

  let min = selector(first.value, index++) as ReturnType<S>;
  if (Number.isNaN(min)) return min;

  let next = iter.next();
  while (!next.done) {
    const currentValue = selector(next.value, index++) as ReturnType<S>;
    if (currentValue < min) {
      min = currentValue;
    } else if (Number.isNaN(currentValue)) {
      return currentValue;
    }
    next = iter.next();
  }

  return min;
}
