// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Comparator, Range, SemVer } from "./types.ts";
import { testComparatorSet } from "./_test_comparator_set.ts";
import { isWildcardComparator } from "./_shared.ts";
import { compare } from "./compare.ts";

/**
 * Check if the SemVer is greater than the range.
 *
 * @example Usage
 * ```ts
 * import { parse, parseRange, greaterThanRange } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const version1 = parse("1.2.3");
 * const version2 = parse("1.2.4");
 * const range = parseRange(">=1.2.3 <1.2.4");
 *
 * assert(!greaterThanRange(version1, range));
 * assert(greaterThanRange(version2, range));
 * ```
 *
 * @param version The version to check.
 * @param range The range to check against.
 * @returns `true` if the semver is greater than the range, `false` otherwise.
 */
export function greaterThanRange(version: SemVer, range: Range): boolean {
  return range.every((comparatorSet) =>
    greaterThanComparatorSet(version, comparatorSet)
  );
}

function greaterThanComparatorSet(
  version: SemVer,
  comparatorSet: Comparator[],
): boolean {
  // If the comparator set contains wildcard, then the semver is not greater than the range.
  if (comparatorSet.some(isWildcardComparator)) return false;
  // If the semver satisfies the comparator set, then it's not greater than the range.
  if (testComparatorSet(version, comparatorSet)) return false;
  // If the semver is less than any of the comparator set, then it's not greater than the range.
  if (
    comparatorSet.some((comparator) => lessThanComparator(version, comparator))
  ) return false;
  return true;
}

function lessThanComparator(version: SemVer, comparator: Comparator): boolean {
  const cmp = compare(version, comparator);
  switch (comparator.operator) {
    case "=":
    case undefined:
      return cmp < 0;
    case "!=":
      return true;
    case ">":
      return cmp <= 0;
    case "<":
      return false;
    case ">=":
      return cmp < 0;
    case "<=":
      return false;
  }
}
