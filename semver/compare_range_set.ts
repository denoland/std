// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import type { RangeSet, SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * Returns 0 if the version is in the range, -1 if it is outside the bounds in the low direction and 1 if outside the bounds in the high direction.
 * @param version The version to compare to the range
 * @param range The range of possible versions
 * @returns 0 if in range, -1 if lower than range, 1 if higher than range
 */
export function compareRangeSet(version: SemVer, range: RangeSet): -1 | 0 | 1 {
  let min: SemVer = range[0][0].min;
  let max: SemVer = range[0][0].max;
  for (const r of range) {
    for (const comparator of r) {
      min = compare(comparator.min, min) === 1 ? comparator.min : min;
      max = compare(comparator.max, max) === -1 ? comparator.max : max;
    }
  }

  if (compare(version, min) === -1) return -1;
  if (compare(version, max) === 1) return 1;

  return 0;
}
