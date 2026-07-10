// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode range}. */
export type RangeOptions = {
  /**
   * The step value.
   * @default {1 or -1}
   */
  step?: number;
};

/**
 * Returns an array of numbers progressing from start up to but not including
 * end, with an optional step value.
 *
 * If only one argument is provided, it is treated as the end value with start
 * defaulting to 0.
 *
 * @param startOrEnd The start value (or end if only one arg)
 * @param end The end value (exclusive)
 * @param options Options for the range
 *
 * @returns An array of numbers
 *
 * @example Basic usage
 * ```ts
 * import { range } from "@std/collections/range";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(range(5), [0, 1, 2, 3, 4]);
 * assertEquals(range(1, 5), [1, 2, 3, 4]);
 * assertEquals(range(0, 10, { step: 2 }), [0, 2, 4, 6, 8]);
 * assertEquals(range(5, 0, { step: -1 }), [5, 4, 3, 2, 1]);
 * ```
 */
export function range(
  startOrEnd: number,
  end?: number,
  options?: RangeOptions,
): number[] {
  const start = end === undefined ? 0 : startOrEnd;
  const stop = end === undefined ? startOrEnd : end;
  const stepValue = options?.step ?? (stop < start ? -1 : 1);

  if (stepValue === 0) {
    throw new RangeError("`step` must not be zero");
  }
  if (!Number.isFinite(start) || !Number.isFinite(stop)) {
    throw new RangeError("`start` and `end` must be finite numbers");
  }

  const result: number[] = [];
  if (stepValue > 0) {
    for (let i = start; i < stop; i += stepValue) {
      result.push(i);
    }
  } else {
    for (let i = start; i > stop; i += stepValue) {
      result.push(i);
    }
  }
  return result;
}
