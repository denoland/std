// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { comparatorIntersects, SemVerComparator } from "./comparator.ts";
import { INVALID, SemVer } from "./semver.ts";
import { gte, lte, sort } from "./operators/mod.ts";

type SemVerRangeAnd = SemVerComparator[];
type SemVerRangeOr = SemVerRangeAnd[];

/**
 * A type representing a semantic version range. The ranges consist of
 * a nested array, which represents a set of OR comparisons while the
 * innner array represents AND comparisons.
 */
export interface SemVerRange {
  // The outter array is OR while each inner array is AND
  ranges: SemVerRangeOr;
}

/**
 * The minimum valid SemVer for a given range or INVALID
 * @param range The range to calculate the min for
 * @returns A valid SemVer or INVALID
 */
export function rangeMin(range: SemVerRange): SemVer { // For and's, you take the biggest min
  // For or's, you take the smallest min
  //[ [1 and 2] or [2 and 3] ] = [ 2 or 3 ] = 2
  return sort(
    range.ranges.map((r) =>
      sort(r.filter((c) => rangeTest(c.min, range)).map((c) => c.min)).pop()!
    ).filter((v) => v),
  ).shift() ?? INVALID;
}

/**
 * The maximum valid SemVer for a given range or INVALID
 * @param range The range to calculate the max for
 * @returns A valid SemVer or INVALID
 */
export function rangeMax(range: SemVerRange): SemVer | undefined {
  // For and's, you take the smallest max
  // For or's, you take the biggest max
  //[ [1 and 2] or [2 and 3] ] = [ 1 or 2 ] = 2
  return sort(
    range.ranges.map((r) =>
      sort(r.filter((c) => rangeTest(c.max, range)).map((c) => c.max)).shift()!
    ),
  ).filter((v) => v).pop() ?? INVALID;
}

/**
 * Test to see if the version satisfies the range.
 * @param version The version to test
 * @param range The range to check
 * @returns true if the version is in the range
 */
export function rangeTest(version: SemVer, range: SemVerRange): boolean {
  for (const r of range.ranges) {
    if (r.every((c) => gte(version, c.min) && lte(version, c.max))) {
      return true;
    }
  }
  return false;
}

/**
 * The ranges intersect every range of AND comparators intersects with a least one range of OR ranges.
 * @param r0 range 0
 * @param r1 range 1
 * @returns returns true if any
 */
export function rangeIntersects(r0: SemVerRange, r1: SemVerRange): boolean {
  return rangesSatisfiable([r0, r1]) && r0.ranges.some((r00) => {
    return r1.ranges.some((r11) => {
      return r00.every((c0) => {
        return r11.every((c1) => comparatorIntersects(c0, c1));
      });
    });
  });
}

function rangesSatisfiable(ranges: SemVerRange[]): boolean {
  return ranges.every(r => {
    // For each OR at least one AND must be satisfiable
    return r.ranges.some(comparators => comparatorsSatisfiable(comparators));
  });
}

function comparatorsSatisfiable(comparators: SemVerComparator[]): boolean {
  // Comparators are satisfiable if they all intersect with each other
  for (let i = 0; i < comparators.length - 1; i++) {
    const c0 = comparators[i];
    for (const c1 of comparators.slice(i + 1)) {
      if (!comparatorIntersects(c0, c1)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Returns the highest version in the list that satisfies the range, or `undefined`
 * if none of them do.
 * @param versions The versions to check.
 * @param range The range of possible versions to compare to.
 * @returns The highest version in versions that satisfies the range.
 */
export function maxSatisfying(
  versions: SemVer[],
  range: SemVerRange,
): SemVer | undefined {
  const satisfying = versions.filter((v) => rangeTest(v, range));
  const sorted = sort(satisfying);
  return sorted.pop();
}

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
  const satisfying = versions.filter((v) => rangeTest(v, range));
  const sorted = sort(satisfying);
  return sorted.shift();
}
