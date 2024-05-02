// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Returns the first element that is the smallest value of the given function or
 * undefined if there are no elements.
 *
 * @template T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Calculate youngest person (`number`)
 * ```ts
 * import { minBy } from "@std/collections/min-by";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 *
 * minBy(people, (person) => person.age);
 * // { name: "John", age: 23 }
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
 * @template T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Calculate shortest name
 * ```ts
 * import { minBy } from "@std/collections/min-by";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "John" },
 * ];
 *
 * minBy(people, (person) => person.name);
 * // { name: "Kim" }
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
 * @template T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Calculate youngest person (`bigint`)
 * ```ts
 * import { minBy } from "@std/collections/min-by";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "John", age: 23n },
 * ];
 *
 * minBy(people, (person) => person.age);
 * // { name: "John", age: 23n }
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
 * @template T The type of the elements in the array.
 *
 * @param array The array to find the minimum element in.
 * @param selector The function to get the value to compare from each element.
 *
 * @returns The first element that is the smallest value of the given function
 * or undefined if there are no elements.
 *
 * @example Calculate earliest start date
 * ```ts
 * import { minBy } from "@std/collections/min-by";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2019-01-01") },
 * ];
 *
 * minBy(people, (person) => person.startedAt);
 * // { name: "John", startedAt: new Date("2019-01-01") }
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
  let min: T | undefined = undefined;
  let minValue: ReturnType<typeof selector> | undefined = undefined;

  for (const current of array) {
    const currentValue = selector(current);

    if (minValue === undefined || currentValue < minValue) {
      min = current;
      minValue = currentValue;
    }
  }

  return min;
}
