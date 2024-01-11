// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, SemVer } from "./types.ts";
import { eq } from "./eq.ts";
import { gt } from "./gt.ts";
import { gte } from "./gte.ts";
import { lt } from "./lt.ts";
import { lte } from "./lte.ts";
import { neq } from "./neq.ts";

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
  switch (comparator.operator) {
    case "":
    case "=":
    case "==":
    case "===":
      return eq(version, comparator.semver);
    case "!=":
    case "!==":
      return neq(version, comparator.semver);
    case ">":
      return gt(version, comparator.semver);
    case ">=":
      return gte(version, comparator.semver);
    case "<":
      return lt(version, comparator.semver);
    case "<=":
      return lte(version, comparator.semver);
    default:
      throw new TypeError(`Invalid operator: ${comparator.operator}`);
  }
}
