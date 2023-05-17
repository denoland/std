// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { Operator, SemVer, SemVerComparator } from "./types.ts";
import { ANY, INVALID, MAX, MIN } from "./semver.ts";
import { cmp } from "./cmp.ts";

/**
 * @deprecated (will be removed after 0.189.0) Import from `std/semver/comparator_min.ts` instead.
 *
 * The minimum semantic version that could match this comparator
 * @param semver The semantic version of the comparator
 * @param operator The operator of the comparator
 * @returns The minimum valid semantic version
 */
export { comparatorMin } from "./comparator_min.ts";

/**
 * A comparator which will span all valid semantic versions
 */
export const ALL: SemVerComparator = {
  operator: "",
  semver: ANY,
  min: MIN,
  max: MAX,
};

/**
 * A comparator which will not span any semantic versions
 */
export const NONE: SemVerComparator = {
  operator: "<",
  semver: MIN,
  min: MAX,
  max: MIN,
};

/**
 * @deprecated (will be removed after 0.189.0) Import from `std/semver/comparator_max.ts` instead.
 *
 * The maximum version that could match this comparator.
 *
 * If an invalid comparator is given such as <0.0.0 then
 * an out of range semver will be returned.
 * @returns the version, the MAX version or the next smallest patch version
 */
export function comparatorMax(semver: SemVer, operator: Operator): SemVer {
  if (semver === ANY) {
    return MAX;
  }
  switch (operator) {
    case "!=":
    case "!==":
    case ">":
    case ">=":
      return MAX;
    case "":
    case "=":
    case "==":
    case "===":
    case "<=":
      return semver;
    case "<": {
      const patch = semver.patch - 1;
      const minor = patch >= 0 ? semver.minor : semver.minor - 1;
      const major = minor >= 0 ? semver.major : semver.major - 1;
      // if you try to do <0.0.0 it will Give you -∞.∞.∞
      // which means no SemVer can compare successfully to it.
      if (major < 0) {
        return INVALID;
      } else {
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
}

/**
 * Test to see if a semantic version falls within the range of the comparator.
 * @param version The version to compare
 * @param comparator The comparator
 * @returns True if the version is within the comparators set otherwise false
 */
export function comparatorTest(
  version: SemVer,
  comparator: SemVerComparator,
): boolean {
  return cmp(version, comparator.operator, comparator.semver);
}

/**
 * @deprecated (will be removed after 0.189.0) Import from `std/semver/comparator_intersects.ts` instead.
 *
 * Returns true if the range of possible versions intersects with the other comparators set of possible versions
 * @param c0 The left side comparator
 * @param c1 The right side comparator
 * @returns True if any part of the comparators intersect
 */
export { comparatorIntersects } from "./comparator_intersects.ts";

export {
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/types.ts` instead.
   *
   * The shape of a valid semantic version comparator
   * @example >=0.0.0
   */
  SemVerComparator,
};
