// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Options for {@linkcode slidingWindows}. */
export interface SlidingWindowsOptions {
  /**
   * If step is set, each window will start that many elements after the last
   * window's start.
   *
   * @default {1}
   */
  step?: number;
  /**
   * If partial is set, windows will be generated for the last elements of the
   * collection, resulting in some undefined values if size is greater than 1.
   *
   * @default {false}
   */
  partial?: boolean;

  /**
   * If maxWindows is set, windows will be generated until the number of windows reaches maxWindows.
   * This is particularly useful when you have an infinite iterable.
   */
  maxWindows?: number;
}

/**
 * Generates sliding views of the given iterable of the given size and returns a
 * new array containing all of them.
 *
 * If step is set, each window will start that many elements after the last
 * window's start. (Default: 1)
 *
 * If partial is set, windows will be generated for the last elements of the
 * collection, resulting in some undefined values if size is greater than 1.
 *
 * @typeParam T The type of the elements in the iterable.
 *
 * @param iterable  The iterable to take elements from.
 * @param size The size of the sliding windows.
 * @param options The options for generating sliding windows.
 *
 * @returns An array containing all sliding windows of the given size.
 *
 * @example Usage
 * ```ts
 * import { slidingWindows } from "@std/collections/sliding-windows";
 * import { assertEquals } from "@std/assert";
 * const numbers = [1, 2, 3, 4, 5];
 *
 * const windows = slidingWindows(numbers, 3);
 * assertEquals(windows, [
 *   [1, 2, 3],
 *   [2, 3, 4],
 *   [3, 4, 5],
 * ]);
 *
 * const windowsWithStep = slidingWindows(numbers, 3, { step: 2 });
 * assertEquals(windowsWithStep, [
 *   [1, 2, 3],
 *   [3, 4, 5],
 * ]);
 *
 * const windowsWithPartial = slidingWindows(numbers, 3, { partial: true });
 * assertEquals(windowsWithPartial, [
 *   [1, 2, 3],
 *   [2, 3, 4],
 *   [3, 4, 5],
 *   [4, 5],
 *   [5],
 * ]);
 * ```
 */
export function slidingWindows<T>(
  iterable: Iterable<T>,
  size: number,
  options: SlidingWindowsOptions = {},
): T[][] {
  const {
    step = 1,
    partial = false,
  } = options;
  if (
    !Number.isInteger(size) || !Number.isInteger(step) || size <= 0 || step <= 0
  ) {
    throw new RangeError("Both size and step must be positive integer.");
  }
  if (
    options.maxWindows !== undefined &&
    (!Number.isInteger(options.maxWindows) || options.maxWindows <= 0)
  ) {
    throw new RangeError("maxWindows must be a positive integer");
  }

  // when the iterable is an array, we can use a more efficient algorithm
  // this also handles the special case where an array can have empty items [ <10 empty items> ]
  if (Array.isArray(iterable)) {
    const maxWindows = options.maxWindows ?? Infinity;
    return Array.from(
      {
        length: Math.min(
          Math.floor((iterable.length - (partial ? 1 : size)) / step + 1),
          maxWindows,
        ),
      },
      (_, i) => iterable.slice(i * step, i * step + size),
    );
  }

  const result: T[][] = [];
  const buffer: T[] = [];
  let currentStep = 0;
  for (const current of iterable) {
    buffer.push(current);
    currentStep++;
    if (currentStep === size) {
      result.push([...buffer]);
      buffer.splice(0, step);
      currentStep -= step;
      if (
        options.maxWindows && result.length === options.maxWindows
      ) {
        break;
      }
    }
  }
  if (partial) {
    while (buffer.length) {
      result.push([...buffer]);
      buffer.splice(0, step);
    }
  }

  return result;
}
