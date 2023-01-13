// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Count the number of non-overlapping instances of substr in str. Return 1 + the number
 * of Unicode points in str if substr is empty.
 *
 * @example
 * ```ts
 * count("cheese", "e"); // 3
 * count("five", ""); // 5
 * ```
 */

export function count(str: string, substr: string): number {
  if (substr === "") return str.length + 1;
  return str.split(substr).length - 1;
}
