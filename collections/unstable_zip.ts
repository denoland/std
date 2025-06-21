// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for zipping arrays */
export type ZipOptions = {
  /**
   * Determines how to handle arrays of different lengths.
   * - `'shortest'`: stops zipping when the shortest array ends.
   * - `'longest'`: continues zipping until the longest array ends, filling missing values with `undefined`.
   * @default {'shortest'}
   */
  truncate?: "shortest" | "longest";
};

/**
 * Builds N-tuples of elements from the given N arrays with matching indices,
 * stopping when the smallest array's end is reached.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T the type of the tuples produced by this function.
 * @typeParam O the type of the options passed.
 *
 * @param options Options for zipping arrays.
 * @param arrays The arrays to zip.
 *
 * @returns A new array containing N-tuples of elements from the given arrays.
 *
 * @example Usage with options
 * ```ts
 * import { zip } from "@std/collections/unstable-zip";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3];
 * const letters = ["a", "b", "c", "d"];
 *
 * assertEquals(
 *   zip({ truncate: "shortest" }, numbers, letters),
 *   [[1, "a"], [2, "b"], [3, "c"]],
 * );
 * assertEquals(
 *   zip({ truncate: "longest" }, numbers, letters),
 *   [[1, "a"], [2, "b"], [3, "c"], [undefined, "d"]],
 * );
 * ```
 */
export function zip<T extends unknown[], O extends ZipOptions>(
  options: O,
  ...arrays: { [K in keyof T]: ReadonlyArray<T[K]> }
): {
  [K in keyof T]: O extends { truncate: "longest" } ? T[K] | undefined : T[K];
}[];
/**
 * Builds N-tuples of elements from the given N arrays with matching indices,
 * stopping when the smallest array's end is reached.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T the type of the tuples produced by this function.
 *
 * @param arrays The arrays to zip.
 *
 * @returns A new array containing N-tuples of elements from the given arrays.
 *
 * @example Basic usage
 * ```ts
 * import { zip } from "@std/collections/unstable-zip";
 * import { assertEquals } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const letters = ["a", "b", "c", "d"];
 * const pairs = zip(numbers, letters);
 *
 * assertEquals(
 *   pairs,
 *   [
 *     [1, "a"],
 *     [2, "b"],
 *     [3, "c"],
 *     [4, "d"],
 *   ],
 * );
 * ```
 */
export function zip<T extends unknown[]>(
  ...arrays: { [K in keyof T]: ReadonlyArray<T[K]> }
): T[];
export function zip(...args: unknown[]): unknown[] {
  const [options, arrays] = args.length === 0 || Array.isArray(args[0])
    ? [{}, args as unknown[][]]
    : [args[0] as ZipOptions, args.slice(1) as unknown[][]];

  if (arrays.length === 0) return [];

  const minLength = Math[options.truncate === "longest" ? "max" : "min"](
    ...arrays.map((x) => x.length),
  );

  const result = new Array(minLength);

  for (let i = 0; i < minLength; i += 1) {
    const arr = arrays.map((it) => it[i]);
    result[i] = arr;
  }

  return result;
}
