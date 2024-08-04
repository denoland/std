// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { assert } from "@std/assert/assert";
import {
  defaultOptions as defaultRandomOptions,
  type RandomOptions,
} from "../random/_types.ts";
import { randomIntegerBetween } from "../random/between.ts";
import { unreachable } from "@std/assert/unreachable";
export type { RandomOptions };

/**
 * Options for {@linkcode sample}.
 */
export type SampleOptions = RandomOptions & {
  /**
   * An array of weights corresponding to each item in the input array.
   * If supplied, this is used to determine the probability of each item being
   * selected.
   *
   * @default {undefined}
   */
  weights?: readonly number[] | undefined;
};
const defaultOptions: SampleOptions = {
  ...defaultRandomOptions,
  weights: undefined,
};

/**
 * Returns a random element from the given array.
 *
 * @typeParam T The type of the elements in the array.
 * @typeParam O The type of the accumulator.
 *
 * @param array The array to sample from.
 * @param options Options modifying the sampling behavior.
 *
 * @returns A random element from the given array, or `undefined` if the array
 * is empty.
 *
 * @example Basic usage
 * ```ts
 * import { sample } from "@std/collections/sample";
 * import { assertArrayIncludes } from "@std/assert";
 *
 * const numbers = [1, 2, 3, 4];
 * const sampled = sample(numbers);
 *
 * assertArrayIncludes(numbers, [sampled]);
 * ```
 *
 * @example Using `weights` option
 * ```ts no-assert
 * import { sample } from "@std/collections/sample";
 * import { assertArrayIncludes } from "@std/random";
 *
 * const weighted = new Map([["a", 5], ["b", 3], ["c", 2]]);
 * const result = sample([...weighted.keys()], { weights: [...weighted.values()] });
 * // gives "a" 50% of the time, "b" 30% of the time, and "c" 20% of the time
 * ```
 */
export function sample<T>(
  array: readonly T[],
  options?: Partial<SampleOptions>,
): T | undefined {
  const { random, weights } = { ...defaultOptions, ...options };

  if (weights) {
    if (!array.length) return undefined;

    const total = Object.values(weights).reduce((sum, n) => sum + n, 0);

    assert(total > 0, "Total weight must be greater than 0");

    const rand = random() * total;
    let current = 0;

    for (const [idx, item] of array.entries()) {
      current += weights[idx]!;

      if (rand < current) {
        return item;
      }
    }

    unreachable();
  }

  return array[randomIntegerBetween(0, array.length - 1, { random })];
}
