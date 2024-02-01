// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, SemVer } from "./types.ts";
import { greaterThan } from "./greater_than.ts";
import { greaterOrEqual } from "./greater_or_equal.ts";
import { lessThan } from "./less_than.ts";
import { lessOrEqual } from "./less_or_equal.ts";
import { equals } from "./equals.ts";

/**
 * Test to see if a semantic version falls within the range of the comparator.
 * @param version The version to compare
 * @param comparator The comparator
 * @returns True if the version is within the comparators set otherwise false
 *
 * @deprecated (will be removed in 0.215.0) Use {@linkcode testRange} instead.
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
      return equals(version, comparator.semver ?? comparator);
    case "!=":
    case "!==":
      return !equals(version, comparator.semver ?? comparator);
    case ">":
      return greaterThan(version, comparator.semver ?? comparator);
    case ">=":
      return greaterOrEqual(version, comparator.semver ?? comparator);
    case "<":
      return lessThan(version, comparator.semver ?? comparator);
    case "<=":
      return lessOrEqual(version, comparator.semver ?? comparator);
    default:
      throw new TypeError(`Invalid operator: ${comparator.operator}`);
  }
}
