// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { RangeSet, SemVer } from "./types.ts";
import { sort } from "./sort.ts";
import { inRangeSet } from "./in_range_set.ts";

/**
 * Returns the highest version in the list that satisfies the range, or `undefined`
 * if none of them do.
 * @param versions The versions to check.
 * @param range The range of possible versions to compare to.
 * @returns The highest version in versions that satisfies the range.
 */
export function maxForRangeSet(
  versions: SemVer[],
  range: RangeSet,
): SemVer | undefined {
  const satisfying = versions.filter((v) => inRangeSet(v, range));
  const sorted = sort(satisfying);
  return sorted.pop();
}
