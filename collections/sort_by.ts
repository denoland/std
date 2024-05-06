// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Order option for {@linkcode SortByOptions}. */
export type Order = "asc" | "desc";

/** Options for {@linkcode sortBy}. */
export type SortByOptions = {
  /**
   * The order to sort the elements in.
   *
   * @default {"asc"}
   */
  order: Order;
};

/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @template T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Sort from youngest to oldest
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "Taylor", age: 23 },
 * ];
 *
 * sortBy(people, (person) => person.age);
 * // [
 * //   { name: "Taylor", age: 23 },
 * //   { name: "Anna", age: 34 },
 * //   { name: "Kim", age: 42 },
 * // ]
 * ```
 *
 * @example Sort from oldest to youngest
 *
 * Setting the `order` options to `desc` will sort the elements in descending
 * order.
 *
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "Taylor", age: 23 },
 * ];
 *
 * sortBy(people, (person) => person.age, { order: "desc" });
 * // [
 * //   { name: "Kim", age: 42 },
 * //   { name: "Anna", age: 34 },
 * //   { name: "Taylor", age: 23 },
 * // ]
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T) => number,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @template T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Sort from shortest to longest name
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "Taylor" },
 * ];
 *
 * sortBy(people, (person) => person.name);
 * // [
 * //   { name: "Kim" },
 * //   { name: "Anna" },
 * //   { name: "Taylor" },
 * // ]
 * ```
 *
 * @example Sort from longest to shortest name
 *
 * Setting the `order` options to `desc` will sort the elements in descending
 * order.
 *
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "Taylor" },
 * ];
 *
 * sortBy(people, (person) => person.name);
 * // [
 * //   { name: "Taylor" },
 * //   { name: "Anna" },
 * //   { name: "Kim" },
 * // ]
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T) => string,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @template T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Sort from youngest to oldest
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "Taylor", age: 23n },
 * ];
 *
 * sortBy(people, (person) => person.age);
 * // [
 * //   { name: "Taylor", age: 23n },
 * //   { name: "Anna", age: 34n },
 * //   { name: "Kim", age: 42n },
 * // ]
 * ```
 *
 * @example Sort from oldest to youngest
 *
 * Setting the `order` options to `desc` will sort the elements in descending
 * order.
 *
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "Taylor", age: 23n },
 * ];
 *
 * sortBy(people, (person) => person.age);
 * // [
 * //   { name: "Kim", age: 42n },
 * //   { name: "Anna", age: 34n },
 * //   { name: "Taylor", age: 23n },
 * // ]
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T) => bigint,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @template T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Sort from earliest to latest start date
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2020-06-01") },
 * ];
 *
 * sortBy(people, (people) => people.startedAt);
 * // [
 * //   { name: "Anna", startedAt: new Date("2020-01-01") },
 * //   { name: "Kim", startedAt: new Date("2020-03-01") },
 * //   { name: "John", startedAt: new Date("2020-06-01") },
 * // ]
 * ```
 *
 * @example Sort from latest to earliest start date
 *
 * Setting the `order` options to `desc` will sort the elements in descending
 * order.
 *
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2020-06-01") },
 * ];
 *
 * sortBy(people, (people) => people.startedAt, { order: "desc" });
 * // [
 * //   { name: "John", startedAt: new Date("2020-06-01") },
 * //   { name: "Kim", startedAt: new Date("2020-03-01") },
 * //   { name: "Anna", startedAt: new Date("2020-01-01") },
 * // ]
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T) => Date,
  options?: SortByOptions,
): T[];
export function sortBy<T>(
  array: readonly T[],
  selector:
    | ((el: T) => number)
    | ((el: T) => string)
    | ((el: T) => bigint)
    | ((el: T) => Date),
  options?: SortByOptions,
): T[] {
  const len = array.length;
  const indexes = new Array<number>(len);
  const selectors = new Array<ReturnType<typeof selector> | null>(len);
  const order = options?.order ?? "asc";

  array.forEach((item, idx) => {
    indexes[idx] = idx;
    const s = selector(item);
    selectors[idx] = Number.isNaN(s) ? null : s;
  });

  indexes.sort((ai, bi) => {
    let a = selectors[ai]!;
    let b = selectors[bi]!;
    if (order === "desc") {
      [a, b] = [b, a];
    }
    if (a === null) return 1;
    if (b === null) return -1;
    return a > b ? 1 : a < b ? -1 : 0;
  });

  for (let i = 0; i < len; i++) {
    (indexes as unknown as T[])[i] = array[indexes[i] as number] as T;
  }

  return indexes as unknown as T[];
}
