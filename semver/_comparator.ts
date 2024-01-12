// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, Operator, SemVer } from "./types.ts";
import { eq } from "./eq.ts";
import { gt } from "./gt.ts";
import { gte } from "./gte.ts";
import { lt } from "./lt.ts";
import { lte } from "./lte.ts";
import { neq } from "./neq.ts";
import {
  COMPARATOR_REGEXP,
  parseBuild,
  parseNumber,
  parsePrerelease,
} from "./_shared.ts";
import { ALL, ANY, INVALID, MAX, MIN, NONE } from "./constants.ts";
import { OPERATORS } from "./_constants.ts";
import { isSemVer } from "./is_semver.ts";
import { format } from "./format.ts";
import { increment } from "./increment.ts";

type REGEXP_GROUPS = {
  operator: Operator;
  major: string;
  minor: string;
  patch: string;
  prerelease: string;
  buildmetadata: string;
};

/**
 * Parses a comparator string into a valid Comparator.
 * @param comparator
 * @returns A valid Comparator
 */
export function parseComparator(comparator: string): Comparator {
  const match = comparator.match(COMPARATOR_REGEXP);
  const groups = match?.groups;

  if (!groups) return NONE;

  const {
    operator = "",

    prerelease,
    buildmetadata,
  } = groups as REGEXP_GROUPS;

  const semver = groups.major
    ? {
      major: parseNumber(groups.major, "Invalid major version"),
      minor: parseNumber(groups.minor, "Invalid minor version"),
      patch: parseNumber(groups.patch, "Invalid patch version"),
      prerelease: prerelease ? parsePrerelease(prerelease) : [],
      build: buildmetadata ? parseBuild(buildmetadata) : [],
    }
    : ANY;

  return { operator, semver };
}

/**
 * Does a deep check on the value to see if it is a valid Comparator object.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a Comparator
 * @returns True if the object is a Comparator otherwise false
 */
export function isComparator(value: unknown): value is Comparator {
  if (
    value === null || value === undefined || Array.isArray(value) ||
    typeof value !== "object"
  ) return false;
  if (value === NONE || value === ALL) return true;
  const { operator, semver } = value as Comparator;
  return (
    OPERATORS.includes(operator) &&
    isSemVer(semver)
  );
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
      return semver.prerelease && semver.prerelease.length > 0
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
 * Formats the comparator into a string
 * @example >=0.0.0
 * @param comparator
 * @returns A string representation of the comparator
 */
export function formatComparator(comparator: Comparator): string {
  const { semver, operator } = comparator;
  return `${operator}${format(semver)}`;
}

/**
 * Test to see if a semantic version falls within the range of the comparator.
 * @param version The version to compare
 * @param comparator The comparator
 * @returns True if the version is within the comparators set otherwise false
 */
export function comparatorIncludes(
  comparator: Comparator,
  version: SemVer,
): boolean {
  switch (comparator.operator) {
    case "":
    case "=":
    case "==":
    case "===":
      return eq(version, comparator.semver);
    case "!=":
    case "!==":
      return neq(version, comparator.semver);
    case ">":
      return gt(version, comparator.semver);
    case ">=":
      return gte(version, comparator.semver);
    case "<":
      return lt(version, comparator.semver);
    case "<=":
      return lte(version, comparator.semver);
    default:
      throw new TypeError(`Invalid operator: ${comparator.operator}`);
  }
}

/**
 * Returns true if the range of possible versions intersects with the other comparators set of possible versions
 * @param c0 The left side comparator
 * @param c1 The right side comparator
 * @returns True if any part of the comparators intersect
 */
export function comparatorIntersects(
  c0: Comparator,
  c1: Comparator,
): boolean {
  const l0 = comparatorMin(c0.semver, c0.operator);
  const l1 = comparatorMax(c0.semver, c0.operator);
  const r0 = comparatorMin(c1.semver, c1.operator);
  const r1 = comparatorMax(c1.semver, c1.operator);

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
