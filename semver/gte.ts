// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { compare } from "./compare.ts";

/**
 * Greater than or equal to comparison
 * @param s0 Left side of the comparison
 * @param s1 Right side of the comparison
 * @returns True if s0 is greater than or equal to s1 otherwise false
 */
export function gte(
  s0: SemVer,
  s1: SemVer,
): boolean {
  return compare(s0, s1) >= 0;
}
