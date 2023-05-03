// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { Operator } from "./types.ts";
import { ANY, INVALID, MAX, MIN, SemVer } from "./semver.ts";
import { cmp } from "./cmp.ts";
import { gt } from "./gt.ts";
import { gte } from "./gte.ts";
import { lte } from "./lte.ts";
import { increment } from "./increment.ts";

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
 * The shape of a valid semantic version comparator
 * @example >=0.0.0
 */
export interface SemVerComparator {
  operator: Operator;
  semver: SemVer;
  min: SemVer;
  max: SemVer;
}

/**
 * The minimum semantic version that could match this comparator
 * @param semver The semantic version of the comparator
 * @param operator The operator of the comparator
 * @returns The minimum valid semantic version
 */
export function comparatorMin(semver: SemVer, operator: Operator): SemVer {
  if (semver === ANY) {
    return MIN;
  }

  switch (operator) {
    case ">":
      return semver.prerelease.length > 0
        ? increment(semver, "pre")
        : increment(semver, "patch");
    case "!=":
    case "!==":
    case "<=":
    case "<":
      // The min(<0.0.0) is MAX
      return gt(semver, MIN) ? MIN : MAX;
    case ">=":
    case "":
    case "=":
    case "==":
    case "===":
      return semver;
  }
}

/**
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
 * Returns true if the range of possible versions intersects with the other comparators set of possible versions
 * @param c0 The left side comparator
 * @param c1 The right side comparator
 * @returns True if any part of the comparators intersect
 */
export function comparatorIntersects(
  c0: SemVerComparator,
  c1: SemVerComparator,
): boolean {
  const l0 = c0.min;
  const l1 = c0.max;
  const r0 = c1.min;
  const r1 = c1.max;

  // We calculate the min and max ranges of both comparators.
  // The minimum min is 0.0.0, the maximum max is ANY.
  //
  // Comparators with equality operators have the same min and max.
  //
  // We then check to see if the min's of either range falls within the span of the other range.
  //
  // A couple of intersection examples:
  // ```
  // l0 ---- l1
  //     r0 ---- r1
  // ```
  // ```
  //     l0 ---- l1
  // r0 ---- r1
  // ```
  // ```
  // l0 ------ l1
  //    r0--r1
  // ```
  // ```
  // l0 - l1
  // r0 - r1
  // ```
  //
  // non-intersection example
  // ```
  // l0 -- l1
  //          r0 -- r1
  // ```
  return (gte(l0, r0) && lte(l0, r1)) || (gte(r0, l0) && lte(r0, l1));
}
