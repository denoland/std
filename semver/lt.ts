// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { compare } from "./compare.ts";

/**
 * Less than comparison
 * @param s0 Left side of the comparison
 * @param s1 Right side of the comparison
 * @returns True if s0 is less than s1 otherwise false
 */
export function lt(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) < 0;
}
