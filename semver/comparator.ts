// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVerComparator } from "./types.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/comparator_min.ts` instead.
   *
   * The minimum semantic version that could match this comparator
   * @param semver The semantic version of the comparator
   * @param operator The operator of the comparator
   * @returns The minimum valid semantic version
   */
  comparatorMin,
} from "./comparator_min.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/constants.ts` instead.
   *
   * A comparator which will span all valid semantic versions
   */
  ALL,
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/constants.ts` instead.
   *
   * A comparator which will not span any semantic versions
   */
  NONE,
} from "./constants.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/comparator_max.ts` instead.
   *
   * The maximum version that could match this comparator.
   *
   * If an invalid comparator is given such as <0.0.0 then
   * an out of range semver will be returned.
   * @returns the version, the MAX version or the next smallest patch version
   */
  comparatorMax,
} from "./comparator_max.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import `inComparator()` from `std/semver/in_comparator.ts` instead.
   *
   * Test to see if a semantic version falls within the range of the comparator.
   * @param version The version to compare
   * @param comparator The comparator
   * @returns True if the version is within the comparators set otherwise false
   */
  inComparator as comparatorTest,
} from "./in_comparator.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/comparator_intersects.ts` instead.
   *
   * Returns true if the range of possible versions intersects with the other comparators set of possible versions
   * @param c0 The left side comparator
   * @param c1 The right side comparator
   * @returns True if any part of the comparators intersect
   */
  comparatorIntersects,
} from "./comparator_intersects.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/types.ts` instead.
   *
   * The shape of a valid semantic version comparator
   * @example >=0.0.0
   */
  SemVerComparator,
};
