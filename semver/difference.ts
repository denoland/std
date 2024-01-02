// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { ReleaseType, SemVer } from "./types.ts";
import { eq } from "./eq.ts";

/**
 * Returns difference between two versions by the release type, or `undefined` if the versions are the same.
 */
export function difference(
  version1: SemVer,
  version2: SemVer,
): ReleaseType | undefined {
  if (eq(version1, version2)) return undefined;

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

  return hasPrerelease ? "prerelease" : undefined;
}
