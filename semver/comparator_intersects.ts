// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator } from "./types.ts";
import * as c from "./_comparator.ts";
/**
 * Returns true if the range of possible versions intersects with the other comparators set of possible versions
 * @param c0 The left side comparator
 * @param c1 The right side comparator
 * @returns True if any part of the comparators intersect
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode rangeIntersects} instead.
 */
export function comparatorIntersects(
  c0: Comparator,
  c1: Comparator,
): boolean {
  return c.comparatorIntersects(c0, c1);
}
