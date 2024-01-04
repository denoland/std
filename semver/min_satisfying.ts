// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer, SemVerComparator, SemVerRange } from "./types.ts";
import { testRange } from "./test_range.ts";
import { lt } from "https://deno.land/std@$STD_VERSION/semver/lt.ts";
import { testComparator } from "https://deno.land/std@$STD_VERSION/semver/test_comparator.ts";

/**
 * Returns the lowest version in the list that satisfies the range, or `undefined` if
 * none of them do.
 * @param versions The versions to check.
 * @param range The range of possible versions to compare to.
 * @returns The lowest version in versions that satisfies the range.
 */
export function minSatisfying(
  versions: SemVer[],
  range: SemVerRange,
): SemVer | undefined {
  let min;
  for (const version of versions) {
    if (!testRange(version, range)) continue;
    min = min && lt(min, version) ? min : version;
  }
  return min;
}
