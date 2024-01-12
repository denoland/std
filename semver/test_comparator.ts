// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, SemVer } from "./types.ts";
import * as c from "./_comparator.ts";
/**
 * Test to see if a semantic version falls within the range of the comparator.
 * @param version The version to compare
 * @param comparator The comparator
 * @returns True if the version is within the comparators set otherwise false
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode testRange} instead.
 */
export function testComparator(
  version: SemVer,
  comparator: Comparator,
): boolean {
  return c.comparatorIncludes(comparator, version);
}
