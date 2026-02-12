// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { ReleaseType, SemVer } from "./types.ts";
import { compareIdentifier } from "./_shared.ts";

/**
 * Returns difference between two SemVers by the release type,
 * or `undefined` if the SemVers are the same.
 *
 * @example Usage
 * ```ts
 * import { parse, difference } from "@std/semver";
 * import { assertEquals } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.2.4");
 * const version3 = parse("1.3.0");
 * const version4 = parse("2.0.0");
 *
 * assertEquals(difference(version1, version2), "patch");
 * assertEquals(difference(version1, version3), "minor");
 * assertEquals(difference(version1, version4), "major");
 * assertEquals(difference(version1, version1), undefined);
 * ```
 *
 * @param version1 The first SemVer to compare
 * @param version2 The second SemVer to compare
 * @returns The release type difference or `undefined` if the versions are the same
 */
export function difference(
  version1: SemVer,
  version2: SemVer,
): ReleaseType | undefined {
  const hasPrerelease = version1.prerelease?.length ||
    version2.prerelease?.length;

  if (version1.major !== version2.major) {
    return hasPrerelease ? "premajor" : "major";
  }
  if (version1.minor !== version2.minor) {
    return hasPrerelease ? "preminor" : "minor";
  }
  if (version1.patch !== version2.patch) {
    return hasPrerelease ? "prepatch" : "patch";
  }

  if (compareIdentifier(version1.prerelease, version2.prerelease) !== 0) {
    return "prerelease";
  }
}
