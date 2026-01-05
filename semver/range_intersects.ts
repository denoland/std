// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { isWildcardComparator } from "./_shared.ts";
import { compare } from "./compare.ts";
import { satisfies } from "./satisfies.ts";
import type { Comparator, Range } from "./types.ts";

function comparatorIntersects(
  comparator1: Comparator,
  comparator2: Comparator,
): boolean {
  const op0 = comparator1.operator;
  const op1 = comparator2.operator;

  if (op0 === undefined) {
    // if comparator1 is empty comparator, then returns true
    if (isWildcardComparator(comparator1)) return true;
    return satisfies(comparator1, [[comparator2]]);
  }
  if (op1 === undefined) {
    if (isWildcardComparator(comparator2)) return true;
    return satisfies(comparator2, [[comparator1]]);
  }

  const cmp = compare(comparator1, comparator2);

  const sameDirectionIncreasing = (op0 === ">=" || op0 === ">") &&
    (op1 === ">=" || op1 === ">");
  const sameDirectionDecreasing = (op0 === "<=" || op0 === "<") &&
    (op1 === "<=" || op1 === "<");
  const sameSemVer = cmp === 0;
  const differentDirectionsInclusive = (op0 === ">=" || op0 === "<=") &&
    (op1 === ">=" || op1 === "<=");
  const oppositeDirectionsLessThan = cmp === -1 &&
    (op0 === ">=" || op0 === ">") &&
    (op1 === "<=" || op1 === "<");
  const oppositeDirectionsGreaterThan = cmp === 1 &&
    (op0 === "<=" || op0 === "<") &&
    (op1 === ">=" || op1 === ">");

  return sameDirectionIncreasing ||
    sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan ||
    oppositeDirectionsGreaterThan;
}

function rangesSatisfiable(ranges: Range[]): boolean {
  return ranges.every((r) => {
    // For each OR at least one AND must be satisfiable
    return r.some((comparators) => comparatorsSatisfiable(comparators));
  });
}

function comparatorsSatisfiable(comparators: Comparator[]): boolean {
  // Comparators are satisfiable if they all intersect with each other
  for (let i = 0; i < comparators.length - 1; i++) {
    const comparator1 = comparators[i]!;
    for (const comparator2 of comparators.slice(i + 1)) {
      if (!comparatorIntersects(comparator1, comparator2)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The ranges intersect every range of AND comparators intersects with a least
 * one range of OR ranges.
 *
 * @example Usage
 * ```ts
 * import { parseRange, rangeIntersects } from "@std/semver";
 * import { assert } from "@std/assert";
 *
 * const range1 = parseRange(">=1.0.0 <2.0.0");
 * const range2 = parseRange(">=1.0.0 <1.2.3");
 * const range3 = parseRange(">=1.2.3 <2.0.0");
 *
 * assert(rangeIntersects(range1, range2));
 * assert(rangeIntersects(range1, range3));
 * assert(!rangeIntersects(range2, range3));
 * ```
 *
 * @param range1 range 0
 * @param range2 range 1
 * @returns returns true if the given ranges intersect, false otherwise
 */
export function rangeIntersects(range1: Range, range2: Range): boolean {
  return rangesSatisfiable([range1, range2]) &&
    range1.some((range10) => {
      return range2.some((r11) => {
        return range10.every((comparator1) => {
          return r11.every((comparator2) =>
            comparatorIntersects(comparator1, comparator2)
          );
        });
      });
    });
}
