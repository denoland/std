// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { compare } from "./compare.ts";

/**
 * A reverse comparison of two versions. Same as compare but
 * `1` and `-1` are invertted.
 *
 * Sorts in descending order if passed to `Array.sort()`,
 * @param s0 Left side of the comparison
 * @param s1 Right side of the comparison
 * @returns True if s0 is greater than s1 otherwise false
 */
export function rcompare(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1 {
  return compare(s1, s0);
}
