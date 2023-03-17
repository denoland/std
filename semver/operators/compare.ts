// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "../semver.ts";

/**
 * Compare two semantic version objects.
 *
 * Returns `0` if `v1 == v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`,
 * @param s0
 * @param s1
 * @returns
 */
export function compare(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1 {
  if (s0 === s1) return 0;
  return (
    compareNumber(s0.major, s1.major) ||
    compareNumber(s0.minor, s1.minor) ||
    compareNumber(s0.patch, s1.patch) ||
    checkIdentifier(s0.prerelease, s1.prerelease) ||
    compareIdentifier(s0.prerelease, s1.prerelease) ||
    checkIdentifier(s1.build, s0.build) ||
    compareIdentifier(s0.build, s1.build)
  );
}

function compareNumber(
  a: number,
  b: number,
): 1 | 0 | -1 {
  if (isNaN(a) || isNaN(b)) {
    throw new Error("Comparison against non-numbers");
  }
  return a === b ? 0 : a < b ? -1 : 1;
}

function checkIdentifier(
  v1: ReadonlyArray<string | number>,
  v2: ReadonlyArray<string | number>,
): 1 | 0 | -1 {
  // NOT having a prerelease is > having one
  // But NOT having a build is < having one
  if (v1.length && !v2.length) {
    return -1;
  } else if (!v1.length && v2.length) {
    return 1;
  } else {
    return 0;
  }
}

function compareIdentifier(
  v1: ReadonlyArray<string | number>,
  v2: ReadonlyArray<string | number>,
): 1 | 0 | -1 {
  let i = 0;
  do {
    const a = v1[i];
    const b = v2[i];
    if (a === undefined && b === undefined) {
      // same length is equal
      return 0;
    } else if (b === undefined) {
      // longer > shorter
      return 1;
    } else if (a === undefined) {
      // shorter < longer
      return -1;
    } else if (typeof a === "string" && typeof b === "number") {
      // string < number
      return -1;
    } else if (typeof a === "number" && typeof b === "string") {
      // number > string
      return 1;
    } else if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      // If they're equal, continue comparing segments.
      continue;
    }
  } while (++i);

  // It can't ever reach here, but typescript doesn't realize that so
  // add this line so the return type is inferred correctly.
  return 0;
}
