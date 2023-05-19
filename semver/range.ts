// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVerRange } from "./types.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/types.ts` instead.
   *
   * A type representing a semantic version range. The ranges consist of
   * a nested array, which represents a set of OR comparisons while the
   * inner array represents AND comparisons.
   */
  SemVerRange,
};

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/range_min.ts` instead.
   *
   * The minimum valid SemVer for a given range or INVALID
   * @param range The range to calculate the min for
   * @returns A valid SemVer or INVALID
   */
  rangeMin,
} from "./range_min.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/range_max.ts` instead.
   *
   * The maximum valid SemVer for a given range or INVALID
   * @param range The range to calculate the max for
   * @returns A valid SemVer or INVALID
   */
  rangeMax,
} from "./range_max.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import `inRange()` from `std/semver/in_range.ts` instead.
   *
   * Test to see if the version satisfies the range.
   * @param version The version to test
   * @param range The range to check
   * @returns true if the version is in the range
   */
  inRange as rangeTest,
} from "./in_range.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/range_intersects.ts` instead.
   *
   * The ranges intersect every range of AND comparators intersects with a least one range of OR ranges.
   * @param r0 range 0
   * @param r1 range 1
   * @returns returns true if any
   */
  rangeIntersects,
} from "./range_intersects.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/max_satisfying.ts` instead.
   *
   * Returns the highest version in the list that satisfies the range, or `undefined`
   * if none of them do.
   * @param versions The versions to check.
   * @param range The range of possible versions to compare to.
   * @returns The highest version in versions that satisfies the range.
   */
  maxSatisfying,
} from "./max_satisfying.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/min_satisfying.ts` instead.
   *
   * Returns the lowest version in the list that satisfies the range, or `undefined` if
   * none of them do.
   * @param versions The versions to check.
   * @param range The range of possible versions to compare to.
   * @returns The lowest version in versions that satisfies the range.
   */
  minSatisfying,
} from "./min_satisfying.ts";
