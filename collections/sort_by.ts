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
 * @typeParam T The type of the iterator elements.
 * @typeParam U The type of the selected values.
 *
 * @param iterator The iterator to sort.
 * @param selector The selector function to get the value to sort by.
 * @param options The options for sorting.
 *
 * @returns A new array containing all elements sorted by the selector.
 *
 * @example Usage with numbers
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
 *
 * @example Usage with strings
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
 *
 * @example Usage with bigints
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
 *
 * @example Usage with Date objects
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
  iterator: Iterable<T>,
  selector:
    | ((el: T, index: number) => number)
    | ((el: T, index: number) => string)
    | ((el: T, index: number) => bigint)
    | ((el: T, index: number) => Date),
  options?: SortByOptions,
): T[] {
  const array: { value: T; selected: string | number | bigint | Date }[] = [];

  let index = 0;
  for (const item of iterator) {
    array.push({ value: item, selected: selector(item, index) });
    index++;
  }

  array.sort((oa, ob) => {
    const a = oa.selected;
    const b = ob.selected;
    const order = options?.order === "desc" ? -1 : 1;

    if (Number.isNaN(a)) return order;
    if (Number.isNaN(b)) return -order;

    return order * (a > b ? 1 : a < b ? -1 : 0);
  });

  return array.map((item) => item.value);
}
