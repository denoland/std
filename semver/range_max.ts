// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { INVALID } from "./constants.ts";
import type { SemVer, SemVerRange } from "./types.ts";
import { testRange } from "./test_range.ts";
import { comparatorMax } from "./comparator_max.ts";
import { compare } from "./compare.ts";

/**
 * The maximum valid SemVer for a given range or INVALID
 * @param range The range to calculate the max for
 * @returns A valid SemVer or INVALID
 */
export function rangeMax(range: SemVerRange): SemVer {
  let max;
  for (const comparators of range.ranges) {
    for (const comparator of comparators) {
      const candidate = comparatorMax(comparator.semver, comparator.operator);
      if (!testRange(candidate, range)) continue;
      max = max && compare(candidate, max) < 0 ? max : candidate;
    }
  }
  return max ?? INVALID;
}
