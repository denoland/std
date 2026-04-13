// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * Not equal comparison for two SemVers.
 *
 * This is equal to `compare(version1, version2) !== 0`.
 *
 * @example Usage
 * ```ts
 * import { parse, notEquals } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.2.4");
 *
 * assert(notEquals(version1, version2));
 * assert(!notEquals(version1, version1));
 * ```
 *
 * @param version1 The first version to compare
 * @param version2 The second version to compare
 * @returns `true` if `version1` is not equal to `version2`, `false` otherwise
 */
export function notEquals(version1: SemVer, version2: SemVer): boolean {
  return compare(version1, version2) !== 0;
}
