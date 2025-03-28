// Copyright 2018-2025 the Deno authors. MIT license.
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
 * Note: If you want to process any iterable, use the new version of
 * `sortBy` from `@std/collections/unstable-sort-by`.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Usage
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 *   { name: "John", age: 23 },
 * ];
 * const sortedByAge = sortBy(people, (person) => person.age);
 *
 * assertEquals(sortedByAge, [
 *   { name: "John", age: 23 },
 *   { name: "Anna", age: 34 },
 *   { name: "Kim", age: 42 },
 * ]);
 *
 * const sortedByAgeDesc = sortBy(people, (person) => person.age, { order: "desc" });
 *
 * assertEquals(sortedByAgeDesc, [
 *   { name: "Kim", age: 42 },
 *   { name: "Anna", age: 34 },
 *   { name: "John", age: 23 },
 * ]);
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T, index: number) => number,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Usage
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna" },
 *   { name: "Kim" },
 *   { name: "John" },
 * ];
 * const sortedByName = sortBy(people, (it) => it.name);
 *
 * assertEquals(sortedByName, [
 *   { name: "Anna" },
 *   { name: "John" },
 *   { name: "Kim" },
 * ]);
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T, index: number) => string,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Usage
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 *   { name: "John", age: 23n },
 * ];
 *
 * const sortedByAge = sortBy(people, (person) => person.age);
 *
 * assertEquals(sortedByAge, [
 *   { name: "John", age: 23n },
 *   { name: "Anna", age: 34n },
 *   { name: "Kim", age: 42n },
 * ]);
 * ```
 */

export function sortBy<T>(
  array: readonly T[],
  selector: (el: T, index: number) => bigint,
  options?: SortByOptions,
): T[];
/**
 * Returns all elements in the given collection, sorted by their result using
 * the given selector. The selector function is called only once for each
 * element. Ascending or descending order can be specified through the `order`
 * option. By default, the elements are sorted in ascending order.
 *
 * @typeParam T The type of the array elements.
 *
 * @param array The array to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Usage
 * ```ts
 * import { sortBy } from "@std/collections/sort-by";
 * import { assertEquals } from "@std/assert";
 *
 * const people = [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2020-06-01") },
 * ];
 *
 * const sortedByStartedAt = sortBy(people, (people) => people.startedAt);
 *
 * assertEquals(sortedByStartedAt, [
 *   { name: "Anna", startedAt: new Date("2020-01-01") },
 *   { name: "Kim", startedAt: new Date("2020-03-01") },
 *   { name: "John", startedAt: new Date("2020-06-01") },
 * ]);
 * ```
 */
export function sortBy<T>(
  array: readonly T[],
  selector: (el: T, index: number) => Date,
  options?: SortByOptions,
): T[];
export function sortBy<T>(
  array: readonly T[],
  selector:
    | ((el: T, index: number) => number)
    | ((el: T, index: number) => string)
    | ((el: T, index: number) => bigint)
    | ((el: T, index: number) => Date),
  options?: SortByOptions,
): T[] {
  const len = array.length;
  const indexes = new Array<number>(len);
  const selectors = new Array<ReturnType<typeof selector> | null>(len);
  const order = options?.order ?? "asc";

  array.forEach((element, index) => {
    indexes[index] = index;
    const selected = selector(element, index);
    selectors[index] = Number.isNaN(selected) ? null : selected;
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
    (indexes as unknown as T[])[i] = array[indexes[i]!] as T;
  }

  return indexes as unknown as T[];
}
