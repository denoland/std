// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { defaultOptions, type RandomOptions } from "./_types.ts";
export type { RandomOptions };

/**
 * Picks a random item from the provided items.
 *
 * @typeParam T - The type of the items in the array
 * @param items - The items to pick from
 * @param options - The options for the random number generator
 * @returns A random item from the provided items
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
): T {
  const { random } = { ...defaultOptions, ...options };

  return items[Math.floor(random() * items.length)]!;
}

/**
 * Picks a random item from the provided items with a weighted probability.
 *
 * @typeParam T - The type of the items in the array
 * @param items The items to pick from, which must each have a numeric `weight` property
 * @param options The options for the random number generator
 * @returns A random item from the provided items with a weighted probability
 *
 * @example Usage
 * ```ts no-assert
 * import { pickWeighted } from "@std/random";
 *
 * const items = [
 *   { name: "a", weight: 1 },
 *   { name: "b", weight: 9999 },
 *   { name: "c", weight: 2 },
 * ];
 *
 * pickWeighted(items); // { name: "b", weight: 9999 }
 * pickWeighted(items); // { name: "b", weight: 9999 }
 * pickWeighted(items); // { name: "b", weight: 9999 }
 * ```
 */
export function pickWeighted<T extends { weight: number }>(
  items: readonly T[],
  options?: Partial<RandomOptions>,
): T {
  const { random } = { ...defaultOptions, ...options };

  const max = Object.values(items).reduce((sum, { weight }) => sum + weight, 0);

  const rand = random() * max;
  let total = 0;

  for (const item of items) {
    total += item.weight;

    if (rand < total) {
      return item;
    }
  }

  return items[0]!;
}
