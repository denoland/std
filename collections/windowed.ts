// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Generates sliding views of the given array of the given size and returns a new
 * array containing all of them.
 *
 * If step is set, each window will start that many elements after the last
 * window's start. (Default: 1)
 *
 * If partial is set, windows will be generated for the last elements of the
 * collection, resulting in some undefined values if size is greather than 1.
 * (Default: false)
 *
 * Example:
 *
 * ```ts
 * import { windowed } from "./windowed.ts"
 * import { assertEquals } from "../testing/asserts.ts";
 * const numbers = [ 1, 2, 3, 4, 5 ]
 *
 * const windows = windowed(numbers, 3)
 * assertEquals(windows, [
 *     [ 1, 2, 3 ],
 *     [ 2, 3, 4 ],
 *     [ 3, 4, 5 ],
 * ])
 *
 * const windowsWithStep = windowed(numbers, 3, {step: 2})
 * assertEquals(windowsWithStep, [
 *     [ 1, 2, 3 ],
 *     [ 3, 4, 5 ],
 * ])
 *
 * const windowsWithPartial = windowed(numbers, 3, {partial: true})
 * assertEquals(windowsWithPartial, [
 *     [ 1, 2, 3 ],
 *     [ 2, 3, 4 ],
 *     [ 3, 4, 5 ],
 *     [4, 5],
 *     [5],
 * ])
 * ```
 */
export function windowed<T>(
  array: readonly T[],
  size: number,
  { step = 1, partial = false }: {
    /**
     * If step is set, each window will start that many elements after the last
     * window's start. (Default: 1)
     */
    step?: number;
    /**
     * If partial is set, windows will be generated for the last elements of the
     * collection, resulting in some undefined values if size is greather than 1.
     * (Default: false)
     */
    partial?: boolean;
  } = {},
): T[][] {
  if (
    !Number.isInteger(size) || !Number.isInteger(step) || size <= 0 || step <= 0
  ) {
    throw new RangeError("Both size and step must be positive integer.");
  }

  /** length of the return array */
  const length = Math.floor((array.length - (partial ? 1 : size)) / step + 1);

  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(array.slice(i * step, i * step + size));
  }
  return result;
}
