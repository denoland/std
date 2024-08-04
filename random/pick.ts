// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "@std/assert/assert";
import { defaultOptions, type RandomOptions } from "./_types.ts";
import { unreachable } from "@std/assert/unreachable";
export type { RandomOptions };

/**
 * Picks a random item from the provided items.
 *
 * @typeParam T - The type of the items in the array
 * @param items - The items to pick from
 * @param options - The options for the random number generator
 * @returns A random item from the provided items or `undefined` if the array is empty
 *
 * @example Usage
 * ```ts no-assert
 * import { pick } from "@std/random";
 *
 * const items = ["a", "b", "c"];
 *
 * pick(items); // "b"
 * pick(items); // "c"
 * pick(items); // "a"
 * ```
 */
export function pick<T>(
  items: readonly T[],
  options?: Partial<RandomOptions>,
): T | undefined {
  const { random } = { ...defaultOptions, ...options };

  return items[Math.floor(random() * items.length)];
}

/**
 * Picks a random item from the provided items with a weighted probability.
 *
 * @typeParam T - The type of the items in the array
 * @param items The items to pick from, which must each have a numeric `weight` property
 * @param options The options for the random number generator
 * @returns A random item from the provided items with a weighted probability or `undefined` if the array is empty
 *
 * @example Usage
 * ```ts no-assert
 * import { pickWeighted } from "@std/random";
 *
 * const items = [
 *   { value: "a", weight: 1 },
 *   { value: "b", weight: 9999 },
 *   { value: "c", weight: 2 },
 * ];
 *
 * pickWeighted(items); // "b"
 * pickWeighted(items); // "b"
 * pickWeighted(items); // "b"
 * ```
 */
export function pickWeighted<T>(
  items: readonly { value: T; weight: number }[],
  options?: Partial<RandomOptions>,
): T | undefined {
  const { random } = { ...defaultOptions, ...options };

  if (!items.length) return undefined;

  const total = Object.values(items).reduce(
    (sum, { weight }) => sum + weight,
    0,
  );

  assert(total > 0, "Total weight must be greater than 0");

  const rand = random() * total;
  let current = 0;

  for (const item of items) {
    current += item.weight;

    if (rand < current) {
      return item.value;
    }
  }

  unreachable();
}
