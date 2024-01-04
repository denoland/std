// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { INVALID } from "./constants.ts";
import type { SemVer, SemVerRange } from "./types.ts";
import { testRange } from "./test_range.ts";
import { comparatorMin } from "./comparator_min.ts";
import { lt } from "./lt.ts";

/**
 * The minimum valid SemVer for a given range or INVALID
 * @param range The range to calculate the min for
 * @returns A valid SemVer or INVALID
 */
export function rangeMin(range: SemVerRange): SemVer {
  let min;
  for (const comparators of range.ranges) {
    for (const comparator of comparators) {
      const candidate = comparatorMin(comparator.semver, comparator.operator);
      if (!testRange(candidate, range)) continue;
      min = min && lt(min, candidate) ? min : candidate;
    }
  }
  return min ?? INVALID;
}
