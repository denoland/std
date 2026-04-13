// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { compare } from "./compare.ts";
import type { SemVer } from "./types.ts";

/**
 * Returns `true` if both SemVers are equivalent.
 *
 * This is equal to `compare(version1, version2) === 0`.
 *
 * @example Usage
 * ```ts
 * import { parse, equals } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.2.3");
 *
 * assert(equals(version1, version2));
 * assert(!equals(version1, parse("1.2.4")));
 * ```
 *
 * @param version1 The first SemVer to compare
 * @param version2 The second SemVer to compare
 * @returns `true` if `version1` is equal to `version2`, `false` otherwise
 */
export function equals(version1: SemVer, version2: SemVer): boolean {
  return compare(version1, version2) === 0;
}
