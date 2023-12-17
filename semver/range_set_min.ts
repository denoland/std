// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { INVALID } from "./constants.ts";
import { sort } from "./sort.ts";
import type { RangeSet, SemVer } from "./types.ts";
import { inRangeSet } from "./in_range_set.ts";

/**
 * The minimum valid SemVer for a given range or INVALID
 * @param range The range to calculate the min for
 * @returns A valid SemVer or INVALID
 */
export function rangeSetMin(range: RangeSet): SemVer { // For and's, you take the biggest min
  // For or's, you take the smallest min
  //[ [1 and 2] or [2 and 3] ] = [ 2 or 3 ] = 2
  return sort(
    range.map((r) =>
      sort(r.filter((c) => inRangeSet(c.min, range)).map((c) => c.min)).pop()!
    ).filter((v) => v),
  ).shift() ?? INVALID;
}
