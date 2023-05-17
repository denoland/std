// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { parse } from "./parse.ts";

/**
 * Compare two semantic version objects.
 *
 * Returns `0` if `v1 == v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`,
 */
export function compare(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1;
/** @deprecated (will be removed after 0.189.0) Use `compare(s0: SemVer, s1: SemVer)` instead. */
export function compare(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): 1 | 0 | -1;
export function compare(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): 1 | 0 | -1 {
  const v0 = typeof s0 === "string" ? parse(s0, options) : s0;
  const v1 = typeof s1 === "string" ? parse(s1, options) : s1;
  const includePrerelease = options?.includePrerelease ?? true;
  if (s0 === s1) return 0;
  if (includePrerelease) {
    return (
      compareNumber(v0.major, v1.major) ||
      compareNumber(v0.minor, v1.minor) ||
      compareNumber(v0.patch, v1.patch) ||
      checkIdentifier(v0.prerelease, v1.prerelease) ||
      compareIdentifier(v0.prerelease, v1.prerelease)
    );
  } else {
    return (compareNumber(v0.major, v1.major) ||
      compareNumber(v0.minor, v1.minor) ||
      compareNumber(v0.patch, v1.patch));
  }
}

/**
 * Compare two semantic version objects including build metadata.
 *
 * Returns `0` if `v1 == v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`,
 * @param s0
 * @param s1
 * @returns
 */
export function compareBuild(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1;
/**
 * @deprecatd (will be removed after 0.189.0) Use `compare(s0: SemVer, s1: SemVer)` instead.
 */
export function compareBuild(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): 1 | 0 | -1;
export function compareBuild(
  s0: string | SemVer,
  s1: string | SemVer,
  _options?: { includePrerelease: boolean },
): 1 | 0 | -1 {
  const v0 = typeof s0 === "string" ? parse(s0) : s0;
  const v1 = typeof s1 === "string" ? parse(s1) : s1;
  if (s0 === s1) return 0;
  return (
    compareNumber(v0.major, v1.major) ||
    compareNumber(v0.minor, v1.minor) ||
    compareNumber(v0.patch, v1.patch) ||
    checkIdentifier(v0.prerelease, v1.prerelease) ||
    compareIdentifier(v0.prerelease, v1.prerelease) ||
    checkIdentifier(v1.build, v0.build) ||
    compareIdentifier(v0.build, v1.build)
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
      // string > number
      return 1;
    } else if (typeof a === "number" && typeof b === "string") {
      // number < string
      return -1;
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

/** @deprecated (will be removed after 0.189.0) Use `compare` or `compareBuild` directly */
export function compareIdentifiers(
  a: string | number | null,
  b: string | number | null,
): 1 | 0 | -1 {
  return compareIdentifier(a != null ? [a] : [], b != null ? [b] : []);
}
/** @deprecated (will be removed after 0.189.0) Use `compare` or `compareBuild` directly */
export function rcompareIdentifiers(
  a: string | number | null,
  b: string | number | null,
): 1 | 0 | -1 {
  return compareIdentifiers(b, a);
}
