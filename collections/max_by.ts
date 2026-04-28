// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Returns the first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the maximum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { maxBy } from "@std/collections/max-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * const personWithMaxAge = maxBy(people, (person) => person.age);
 *
 * assertEquals(personWithMaxAge, { name: "Kim", age: 42 });
 * ```
 */
export function maxBy<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => number,
): T | undefined;
/**
 * Returns the first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the maximum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { maxBy } from "@std/collections/max-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "John" },
 * ];
 *
 * const personWithMaxName = maxBy(people, (person) => person.name);
 *
 * assertEquals(personWithMaxName, { name: "Kim" });
 * ```
 */
export function maxBy<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => string,
): T | undefined;
/**
 * Returns the first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the maximum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { maxBy } from "@std/collections/max-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "John", age: 23n },
 * ];
 *
 * const personWithMaxAge = maxBy(people, (person) => person.age);
 *
 * assertEquals(personWithMaxAge, { name: "Kim", age: 42n });
 * ```
 */
export function maxBy<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => bigint,
): T | undefined;
/**
 * Returns the first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @typeParam T The type of the elements in the array.
 *
 * @param array The array to find the maximum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the largest value of the given function or
 * undefined if there are no elements.
 *
 * @example Basic usage
 * ```ts
 * import { maxBy } from "@std/collections/max-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2021-03-01") },
 *   { name: "John", startedAt: new Date("2020-03-01") },
 * ];
 *
 * const personWithLastStartedAt = maxBy(people, (person) => person.startedAt);
 *
 * assertEquals(personWithLastStartedAt, { name: "Kim", startedAt: new Date("2021-03-01") });
 * ```
 */
export function maxBy<T>(
  array: Iterable<T>,
  selector: (el: T, index: number) => Date,
): T | undefined;
export function maxBy<T>(
  array: Iterable<T>,
  selector:
    | ((el: T, index: number) => number)
    | ((el: T, index: number) => string)
    | ((el: T, index: number) => bigint)
    | ((el: T, index: number) => Date),
): T | undefined {
  if (Array.isArray(array)) {
    const length = array.length;
    if (length === 0) return undefined;

    let max: T = array[0]!;
    let maxValue = selector(max, 0);

    for (let i = 1; i < length; i++) {
      const current = array[i]!;
      const currentValue = selector(current, i);
      if (currentValue > maxValue) {
        max = current;
        maxValue = currentValue;
      }
    }

    return max;
  }

  const iter = array[Symbol.iterator]();
  const first = iter.next();

  if (first.done) return undefined;

  let index = 0;
  let max: T = first.value;
  let maxValue = selector(max, index++);

  let next = iter.next();
  while (!next.done) {
    const currentValue = selector(next.value, index++);
    if (currentValue > maxValue) {
      max = next.value;
      maxValue = currentValue;
    }
    next = iter.next();
  }

  return max;
}
