// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { Comparator, Range, SemVer } from "./types.ts";
import { testComparatorSet } from "./_test_comparator_set.ts";
import { isWildcardComparator } from "./_shared.ts";
import { compare } from "./compare.ts";

/**
 * Check if the SemVer is less than the range.
 *
 * @example Usage
 * ```ts
 * import { parse, parseRange, lessThanRange } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.0.0");
 * const range = parseRange(">=1.2.3 <1.2.4");
 *
 * assert(!lessThanRange(version1, range));
 * assert(lessThanRange(version2, range));
 * ```
 *
 * @param version The version to check.
 * @param range The range to check against.
 * @returns `true` if the SemVer is less than the range, `false` otherwise.
 */
export function lessThanRange(version: SemVer, range: Range): boolean {
  return range.every((comparatorSet) =>
    lessThanComparatorSet(version, comparatorSet)
  );
}

function lessThanComparatorSet(version: SemVer, comparatorSet: Comparator[]) {
  // If the comparator set contains wildcard, then the semver is not greater than the range.
  if (comparatorSet.some(isWildcardComparator)) return false;
  // If the SemVer satisfies the comparator set, then it's not less than the range.
  if (testComparatorSet(version, comparatorSet)) return false;
  // If the SemVer is greater than any of the comparator set, then it's not less than the range.
  if (
    comparatorSet.some((comparator) =>
      greaterThanComparator(version, comparator)
    )
  ) return false;
  return true;
}

function greaterThanComparator(
  version: SemVer,
  comparator: Comparator,
): boolean {
  const cmp = compare(version, comparator);
  switch (comparator.operator) {
    case "=":
    case undefined:
      return cmp > 0;
    case "!=":
      return cmp <= 0;
    case ">":
      return false;
    case "<":
      return cmp >= 0;
    case ">=":
      return false;
    case "<=":
      return cmp > 0;
  }
}
