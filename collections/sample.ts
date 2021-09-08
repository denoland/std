// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { randomNumber } from "./_utils.ts";

/**
 * Returns a random element from the given array.
 *
 * Example:
 *
 * ```ts
 * import { sample } from "./sample.ts"
 * import { assert } from "../testing/asserts.ts";
 *
 * const numbers = [1, 2, 3, 4];
 * const random = sample(numbers);
 *
 * assert(numbers.includes(random));
 * ```
 */
export function sample<T>(array: readonly T[]): T | undefined {
  const length = array.length;
  return length ? array[randomNumber(0, length - 1)] : undefined;
}
