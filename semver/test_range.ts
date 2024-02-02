// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer, SemVerRange } from "./types.ts";
import { greaterOrEqual } from "./greater_or_equal.ts";
import { lessOrEqual } from "./less_or_equal.ts";
import { comparatorMin } from "./comparator_min.ts";
import { comparatorMax } from "./comparator_max.ts";

/**
 * Test to see if the version satisfies the range.
 * @param version The version to test
 * @param range The range to check
 * @returns true if the version is in the range
 */
export function testRange(
  version: SemVer,
  range: SemVerRange | Range,
): boolean {
  for (const r of (Array.isArray(range) ? range : range.ranges)) {
    if (
      r.every((c) =>
        greaterOrEqual(version, comparatorMin(c.semver ?? c, c.operator)) &&
        lessOrEqual(version, comparatorMax(c.semver ?? c, c.operator))
      )
    ) {
      return true;
    }
  }
  return false;
}
