// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import {
  checkIdentifier,
  compareIdentifier,
  compareNumber,
} from "./_shared.ts";

/**
 * Compare two semantic version objects.
 *
 * Returns `0` if `a === b`, or `1` if `a` is greater, or `-1` if `b` is
 * greater.
 *
 * Sorts in ascending order if passed to `Array.sort()`.
 *
 * The number returned by `compare` can then be compared to `0` in order to
 * determine some common cases:
 * - `compare(a, b) === 0` a equal to b
 * - `compare(a, b) !== 0` a not equal to b
 * - `compare(a, b) < 0`   a less than b
 * - `compare(a, b) <= 0`  a less than or equal to b
 * - `compare(a, b) > 0`   a greater than b
 * - `compare(a, b) >= 0`  a greater than or equal to b
 */
export function compare(
  a: SemVer,
  b: SemVer,
): 1 | 0 | -1 {
  if (a === b) return 0;
  return (
    compareNumber(a.major, b.major) ||
    compareNumber(a.minor, b.minor) ||
    compareNumber(a.patch, b.patch) ||
    checkIdentifier(a.prerelease, b.prerelease) ||
    compareIdentifier(a.prerelease, b.prerelease)
  );
}
