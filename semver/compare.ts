// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import {
  checkIdentifier,
  compareIdentifier,
  compareNumber,
} from "./_shared.ts";

const matchers = ["version", "prerelease", "build"] as const;

export interface CompareOptions {
  matcher?: typeof matchers[number];
}
/**
 * Compare two semantic version objects.
 *
 * Returns `0` if `v1 === v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`,
 */
export function compare(
  s0: SemVer,
  s1: SemVer,
  { matcher = "prerelease" }: CompareOptions = {},
): 1 | 0 | -1 {
  if (s0 === s1) return 0;
  const matcherIndex = matchers.indexOf(matcher);
  return (
    compareNumber(s0.major, s1.major) ||
    compareNumber(s0.minor, s1.minor) ||
    compareNumber(s0.patch, s1.patch) ||
    (matcherIndex >= matchers.indexOf("prerelease")
      ? checkIdentifier(s0.prerelease, s1.prerelease) ||
        compareIdentifier(s0.prerelease, s1.prerelease)
      : 0) ||
    (matcherIndex >= matchers.indexOf("build")
      ? checkIdentifier(s1.build, s0.build) ||
        compareIdentifier(s0.build, s1.build)
      : 0)
  );
}
