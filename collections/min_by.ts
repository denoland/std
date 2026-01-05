// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns the first element that is the smallest value of the given function or
 * undefined if there are no elements.
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
 * import { minBy } from "@std/collections/min-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * const personWithMinAge = minBy(people, (i) => i.age);
 *
 * assertEquals(personWithMinAge, { name: "John", age: 23 });
 * ```
 */
export function minBy<T>(
  array: Iterable<T>,
  selector: (el: T) => number,
): T | undefined;
/**
 * Returns the first element that is the smallest value of the given function or
 * undefined if there are no elements.
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
 * import { minBy } from "@std/collections/min-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "John" },
 * ];
 *
 * const personWithMinName = minBy(people, (person) => person.name);
 *
 * assertEquals(personWithMinName, { name: "Anna" });
 * ```
 */
export function minBy<T>(
  array: Iterable<T>,
  selector: (el: T) => string,
): T | undefined;
/**
 * Returns the first element that is the smallest value of the given function or
 * undefined if there are no elements.
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
 * import { minBy } from "@std/collections/min-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "John", age: 23n },
 * ];
 *
 * const personWithMinAge = minBy(people, (i) => i.age);
 *
 * assertEquals(personWithMinAge, { name: "John", age: 23n });
 * ```
 */
export function minBy<T>(
  array: Iterable<T>,
  selector: (el: T) => bigint,
): T | undefined;
/**
 * Returns the first element that is the smallest value of the given function or
 * undefined if there are no elements.
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
 * import { minBy } from "@std/collections/min-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2019-01-01") },
 * ];
 *
 * const personWithMinStartedAt = minBy(people, (person) => person.startedAt);
 * ```
 */
export function minBy<T>(
  array: Iterable<T>,
  selector: (el: T) => Date,
): T | undefined;
export function minBy<T>(
  array: Iterable<T>,
  selector:
    | ((el: T) => number)
    | ((el: T) => string)
    | ((el: T) => bigint)
    | ((el: T) => Date),
): T | undefined {
  if (Array.isArray(array)) {
    const length = array.length;
    if (length === 0) return undefined;

    let min: T = array[0]!;
    let minValue = selector(min);

    for (let i = 1; i < length; i++) {
      const current = array[i]!;
      const currentValue = selector(current);
      if (currentValue < minValue) {
        min = current;
        minValue = currentValue;
      }
    }

    return min;
  }

  const iter = array[Symbol.iterator]();
  const first = iter.next();

  if (first.done) return undefined;

  let min: T = first.value;
  let minValue = selector(min);

  let next = iter.next();
  while (!next.done) {
    const currentValue = selector(next.value);
    if (currentValue < minValue) {
      min = next.value;
      minValue = currentValue;
    }
    next = iter.next();
  }

  return min;
}
