// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, Operator, SemVer } from "./types.ts";
import { ANY, MAX, MIN } from "./constants.ts";
import { gt } from "./gt.ts";
import { increment } from "./increment.ts";
import { isComparator } from "./is_comparator.ts";

/**
 * @deprecated (will be removed in 0.213.0) Use a {@linkcode Comparator} argument instead.
 */
export function comparatorMin(semver: SemVer, operator: Operator): SemVer;
/**
 * The minimum semantic version that could match this comparator
 * @param semver The semantic version of the comparator
 * @param operator The operator of the comparator
 * @returns The minimum valid semantic version
 */
export function comparatorMin(comparator: Comparator): SemVer;
export function comparatorMin(
  comparator: SemVer | Comparator,
  op?: Operator,
): SemVer {
  if (!isComparator(comparator)) {
    comparator = { operator: op as Operator, semver: comparator };
  }
  const { operator, semver } = comparator;

  if (semver === ANY) {
    return MIN;
  }

  switch (operator) {
    case ">":
      return semver.prerelease && semver.prerelease.length > 0
        ? increment(semver, "pre")
        : increment(semver, "patch");
    case "!=":
    case "!==":
    case "<=":
    case "<":
      // The min(<0.0.0) is MAX
      return gt(semver, MIN) ? MIN : MAX;
    case ">=":
    case "":
    case "=":
    case "==":
    case "===":
      return semver;
  }
}
