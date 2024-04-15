// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { INVALID, MAX } from "./constants.ts";
import type { Comparator, Range, SemVer } from "./types.ts";
import { testRange } from "./test_range.ts";
import { greaterThan } from "./greater_than.ts";
import { isWildcardComparator } from "./_shared.ts";

function comparatorMax(comparator: Comparator): SemVer {
  const semver = comparator;
  if (isWildcardComparator(comparator)) return MAX;
  switch (comparator.operator) {
    case "!=":
    case ">":
    case ">=":
      return MAX;
    case undefined:
    case "=":
    case "<=":
      return {
        major: semver.major,
        minor: semver.minor,
        patch: semver.patch,
        prerelease: semver.prerelease,
        build: semver.build,
      };
    case "<": {
      const patch = semver.patch - 1;
      const minor = patch >= 0 ? semver.minor : semver.minor - 1;
      const major = minor >= 0 ? semver.major : semver.major - 1;
      // if you try to do <0.0.0 it will Give you -∞.∞.∞
      // which means no SemVer can compare successfully to it.
      if (major < 0) return INVALID;

      return {
        major,
        minor: minor >= 0 ? minor : Number.POSITIVE_INFINITY,
        patch: patch >= 0 ? patch : Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      };
    }
  }
}

/**
 * @deprecated (will be removed in 1.0.0) Use {@linkcode greaterThanRange} or
 * {@linkcode lessThanRange} for comparing ranges and semvers. The maximum
 * version of a range is often not well defined, and therefore this API
 * shouldn't be used. See
 * {@link https://github.com/denoland/deno_std/issues/4365} for details.
 *
 * The maximum valid SemVer for a given range or INVALID
 * @param range The range to calculate the max for
 * @returns A valid SemVer or INVALID
 */
export function rangeMax(range: Range): SemVer {
  let max;
  for (const comparators of range) {
    for (const comparator of comparators) {
      const candidate = comparatorMax(comparator);
      if (!testRange(candidate, range)) continue;
      max = (max && greaterThan(max, candidate)) ? max : candidate;
    }
  }
  return max ?? INVALID;
}
