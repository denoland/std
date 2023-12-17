// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { RangeSet, SemVer } from "./types.ts";
import { gte } from "./gte.ts";
import { lte } from "./lte.ts";

/**
 * Test to see if the version satisfies the range.
 * @param version The version to test
 * @param range The range to check
 * @returns true if the version is in the range
 */
export function inRangeSet(version: SemVer, range: RangeSet): boolean {
  for (const r of range) {
    if (r.every((c) => gte(version, c.min) && lte(version, c.max))) {
      return true;
    }
  }
  return false;
}
