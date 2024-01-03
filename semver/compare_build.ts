// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

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
 * @deprecated (will be removed after 0.213.0) Use {@linkcode compare} with `{ matcher = "build" }` instead.
 */
export function compareBuild(
  s0: SemVer,
  s1: SemVer,
): 1 | 0 | -1 {
  return compare(s0, s1, { matcher: "build" });
}
