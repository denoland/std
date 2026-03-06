// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * Less than comparison for two SemVers.
 *
 * This is equal to `compare(version1, version2) < 0`.
 *
 * @example Usage
 * ```ts
 * import { parse, lessThan } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.2.4");
 *
 * assert(lessThan(version1, version2));
 * assert(!lessThan(version2, version1));
 * assert(!lessThan(version1, version1));
 * ```
 *
 * @param version1 the first version to compare
 * @param version2 the second version to compare
 * @returns `true` if `version1` is less than `version2`, `false` otherwise
 */
export function lessThan(version1: SemVer, version2: SemVer): boolean {
  return compare(version1, version2) < 0;
}
