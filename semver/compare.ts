// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { parse } from "./parse.ts";
import {
  checkIdentifier,
  compareIdentifier,
  compareNumber,
} from "./_shared.ts";

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
/** @deprecated (will be removed after 0.200.0) Use `compare(s0: SemVer, s1: SemVer)` instead. */
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
  const v0 = parse(s0, options);
  const v1 = parse(s1, options);
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
