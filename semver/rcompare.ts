// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * A reverse comparison of two versions. Same as compare but
 * `1` and `-1` are inverted.
 *
 * Sorts in descending order if passed to `Array.sort()`,
 */
export function rcompare(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1;
/** @deprecated (will be removed after 0.200.0) Use `rcompare(s0: SemVer, s1: SemVer)` instead. */
export function rcompare(
  s0: string | SemVer,
  s1: string | SemVer,
): 1 | 0 | -1;
export function rcompare(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): 1 | 0 | -1 {
  return compare(s1, s0, options);
}
