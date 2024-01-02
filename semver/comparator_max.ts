// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator, Operator, SemVer } from "./types.ts";
import { ANY, INVALID, MAX } from "./constants.ts";
import { isComparator } from "./is_comparator.ts";

/**
 * @deprecated (will be removed in 0.213.0) Use a {@linkcode Comparator} argument instead.
 */
export function comparatorMax(semver: SemVer, operator: Operator): SemVer;
/**
 * The maximum version that could match this comparator.
 *
 * If an invalid comparator is given such as <0.0.0 then
 * an out of range semver will be returned.
 * @returns the version, the MAX version or the next smallest patch version
 */
export function comparatorMax(comparator: Comparator): SemVer;
export function comparatorMax(
  comparator: SemVer | Comparator,
  op?: Operator,
): SemVer {
  if (!isComparator(comparator)) {
    comparator = { operator: op as Operator, semver: comparator };
  }
  const { operator, semver } = comparator;

  if (semver === ANY) {
    return MAX;
  }
  switch (operator) {
    case "!=":
    case "!==":
    case ">":
    case ">=":
      return MAX;
    case "":
    case "=":
    case "==":
    case "===":
    case "<=":
      return semver;
    case "<": {
      const patch = semver.patch - 1;
      const minor = patch >= 0 ? semver.minor : semver.minor - 1;
      const major = minor >= 0 ? semver.major : semver.major - 1;
      // if you try to do <0.0.0 it will Give you -∞.∞.∞
      // which means no SemVer can compare successfully to it.
      if (major < 0) {
        return INVALID;
      } else {
        return {
          major,
          minor: minor >= 0 ? minor : Number.POSITIVE_INFINITY,
          patch: patch >= 0 ? patch : Number.POSITIVE_INFINITY,
          prerelease: [],
          build: [],
        };
      }
    }
  }
}
