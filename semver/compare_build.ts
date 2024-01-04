// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import {
  checkIdentifier,
  compareIdentifier,
  compareNumber,
} from "./_shared.ts";

/**
 * Compare two semantic version objects including build metadata.
 *
 * Returns `0` if `v1 === v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`,
 * @param s0
 * @param s1
 * @returns
 *
 * @deprecated (will be removed in 0.213.0) The build metadata should not be used for comparing versions. See https://semver.org/#spec-item-10 for details.
 */
export function compareBuild(
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
