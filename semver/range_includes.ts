// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, Range, SemVer } from "./types.ts";

import { isWildcardComparator } from "./_shared.ts";
import { comparatorIncludes } from "./_comparator_includes.ts";

function comparatorSetIncludes(
  version: SemVer,
  set: Comparator[],
): boolean {
  for (const comparator of set) {
    if (!comparatorIncludes(version, comparator)) {
      return false;
    }
  }
  if (version.prerelease && version.prerelease.length > 0) {
    // Find the comparator that is allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (const comparator of set) {
      if (isWildcardComparator(comparator)) {
        continue;
      }
      const { prerelease } = comparator.semver ?? comparator;
      if (prerelease && prerelease.length > 0) {
        const major = comparator.semver?.major ?? comparator.major;
        const minor = comparator.semver?.minor ?? comparator.minor;
        const patch = comparator.semver?.patch ?? comparator.patch;
        if (
          version.major === major && version.minor === minor &&
          version.patch === patch
        ) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
}

/**
 * Test to see if the version satisfies the range.
 * @param version The version to test
 * @param range The range to check
 * @returns true if the version is in the range
 */
export function rangeIncludes(range: Range, version: SemVer): boolean {
  return range.some((set) => comparatorSetIncludes(version, set));
}
